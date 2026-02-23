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
    const { durationDays, options, optionValues, paymentMethod } = await request.json();

    const ad = await prisma.ad.findUnique({ where: { id } });

    if (!ad) {
      return NextResponse.json({ error: "광고를 찾을 수 없습니다" }, { status: 404 });
    }

    if (ad.userId !== session.user.id) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    if (ad.status !== "EXPIRED") {
      return NextResponse.json({ error: "만료된 광고만 연장할 수 있습니다" }, { status: 400 });
    }

    if (ad.productId === "FREE") {
      return NextResponse.json({ error: "무료 광고는 연장이 필요하지 않습니다" }, { status: 400 });
    }

    const product = AD_PRODUCTS[ad.productId];
    if (!product) {
      return NextResponse.json({ error: "유효하지 않은 상품입니다" }, { status: 400 });
    }

    if (![30, 60, 90].includes(durationDays)) {
      return NextResponse.json({ error: "기간은 30, 60, 90일만 선택 가능합니다" }, { status: 400 });
    }

    if (!paymentMethod || !["CARD", "BANK_TRANSFER", "KAKAO_PAY"].includes(paymentMethod)) {
      return NextResponse.json({ error: "유효한 결제 방법을 선택해주세요" }, { status: 400 });
    }

    // BANNER 슬롯 확인
    if (ad.productId === "BANNER") {
      const bannerCount = await prisma.ad.count({
        where: { productId: "BANNER", status: "ACTIVE" },
      });
      if (bannerCount >= (AD_PRODUCTS.BANNER.maxSlots || 12)) {
        return NextResponse.json({ error: "노블레스 슬롯이 모두 찼습니다" }, { status: 400 });
      }
    }

    const duration = durationDays as DurationDays;

    // 가격 계산
    const linePrice = AD_PRODUCTS.LINE.pricing[duration];
    let upgradePrice = 0;
    if (ad.productId !== "LINE") {
      upgradePrice = product.pricing[duration];
    }

    let optionsPrice = 0;
    const optionsList: Array<{ id: AdOptionId; name: string; value: string | null }> = [];

    if (options && Array.isArray(options)) {
      for (const optId of options) {
        const option = AD_OPTIONS[optId as AdOptionId];
        if (!option) continue;
        const isFreeIcon = optId === "ICON" && product.includeIconFree;
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
    const orderId = `YSJ-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const itemSnapshot = {
      type: "renew",
      product: { id: ad.productId, name: product.name },
      options: optionsList,
      duration: durationDays,
      newFeatures: {
        autoJumpPerDay: product.autoJumpPerDay,
        manualJumpPerDay: product.manualJumpPerDay,
        maxEdits: product.maxEdits,
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
      orderName: `${product.name} 연장 (${durationDays}일)`,
    });
  } catch (error) {
    console.error("Ad renew error:", error);
    return NextResponse.json({ error: "연장 요청에 실패했습니다" }, { status: 500 });
  }
}
