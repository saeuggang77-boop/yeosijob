import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AD_PRODUCTS, AD_OPTIONS, type DurationDays } from "@/lib/constants/products";
import type { AdOptionId, PaymentMethod } from "@/generated/prisma/client";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "BUSINESS") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    const { id } = await params;
    const {
      productId: newProductId,
      durationDays,
      options,
      optionValues,
      paymentMethod,
      regions,
    } = await request.json();

    // 광고 조회 및 소유권 확인
    const ad = await prisma.ad.findUnique({
      where: { id },
    });

    if (!ad) {
      return NextResponse.json(
        { error: "광고를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    if (ad.userId !== session.user.id) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    // 업그레이드 가능 여부 확인
    if (ad.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "활성화된 광고만 업그레이드할 수 있습니다" },
        { status: 400 }
      );
    }

    const currentProduct = AD_PRODUCTS[ad.productId];
    const newProduct = AD_PRODUCTS[newProductId];

    if (!newProduct) {
      return NextResponse.json(
        { error: "유효하지 않은 상품입니다" },
        { status: 400 }
      );
    }

    // 상위 등급 확인 (rank가 낮을수록 상위)
    if (newProduct.rank >= currentProduct.rank) {
      return NextResponse.json(
        { error: "현재 상품보다 상위 등급만 선택할 수 있습니다" },
        { status: 400 }
      );
    }

    // BANNER 슬롯 제한 확인
    if (newProductId === "BANNER") {
      const bannerCount = await prisma.ad.count({
        where: {
          productId: "BANNER",
          status: "ACTIVE",
        },
      });

      if (bannerCount >= (AD_PRODUCTS.BANNER.maxSlots || 12)) {
        return NextResponse.json(
          { error: "노블레스 슬롯이 모두 찼습니다 (12건 한정)" },
          { status: 400 }
        );
      }
    }

    // 기간 유효성 확인
    if (![30, 60, 90].includes(durationDays)) {
      return NextResponse.json(
        { error: "기간은 30, 60, 90일만 선택 가능합니다" },
        { status: 400 }
      );
    }

    // 결제 방법 확인
    if (!paymentMethod || !["CARD", "BANK_TRANSFER", "KAKAO_PAY"].includes(paymentMethod)) {
      return NextResponse.json(
        { error: "유효한 결제 방법을 선택해주세요" },
        { status: 400 }
      );
    }

    const duration = durationDays as DurationDays;

    // 가격 계산
    const linePrice = AD_PRODUCTS.LINE.pricing[duration];
    let upgradePrice = 0;
    if (newProductId !== "LINE") {
      upgradePrice = newProduct.pricing[duration];
    }

    // 옵션 가격 계산
    let optionsPrice = 0;
    const optionsList: Array<{ id: AdOptionId; name: string; value: string | null }> = [];

    if (options && Array.isArray(options)) {
      for (const optId of options) {
        const option = AD_OPTIONS[optId as AdOptionId];
        if (!option) continue;

        // 아이콘이 무료 포함되는 경우 체크
        const isFreeIcon = optId === "ICON" && newProduct.includeIconFree;
        if (!isFreeIcon) {
          optionsPrice += option.pricing[duration];
        }

        optionsList.push({
          id: optId as AdOptionId,
          name: option.name,
          value: optionValues?.[optId] || null,
        });
      }
    }

    const totalAmount = linePrice + upgradePrice + optionsPrice;

    // orderId 생성
    const orderId = `YSJ-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // 결제 정보 생성 (itemSnapshot에 upgrade 정보 포함)
    const itemSnapshot = {
      type: "upgrade",
      fromProductId: ad.productId,
      product: {
        id: newProductId,
        name: newProduct.name,
      },
      options: optionsList,
      duration: durationDays,
      newFeatures: {
        autoJumpPerDay: newProduct.autoJumpPerDay,
        manualJumpPerDay: newProduct.manualJumpPerDay,
        maxEdits: newProduct.maxEdits,
      },
      breakdown: {
        line: linePrice,
        upgrade: upgradePrice,
        options: optionsPrice,
        total: totalAmount,
      },
    };

    const payment = await prisma.payment.create({
      data: {
        userId: session.user.id,
        adId: ad.id,
        orderId,
        amount: totalAmount,
        method: paymentMethod as PaymentMethod,
        status: "PENDING",
        itemSnapshot,
      },
    });

    return NextResponse.json({
      adId: ad.id,
      orderId: payment.orderId,
      amount: totalAmount,
      orderName: `${newProduct.name} 업그레이드 (${durationDays}일)`,
    });
  } catch (error) {
    console.error("Ad upgrade error:", error);
    const message =
      error instanceof Error ? error.message : "업그레이드 요청에 실패했습니다";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
