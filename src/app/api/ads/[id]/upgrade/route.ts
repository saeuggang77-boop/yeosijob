import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { AD_PRODUCTS, AD_OPTIONS, type DurationDays } from "@/lib/constants/products";
import type { AdOptionId, PaymentMethod } from "@/generated/prisma/client";
import crypto from "node:crypto";
import { sendPushNotification } from "@/lib/push-notification";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "BUSINESS") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    // #29: Rate limiting (분당 5회)
    const { success: rateLimitOk } = await checkRateLimit(`ad-upgrade:${session.user.id}`, 5, 60_000);
    if (!rateLimitOk) {
      return NextResponse.json({ error: "너무 많은 요청입니다. 잠시 후 다시 시도해주세요" }, { status: 429 });
    }

    const { id } = await params;
    const {
      productId: newProductId,
      durationDays,
      options,
      optionValues,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

    // 기간 유효성 확인
    if (![30, 60, 90].includes(durationDays)) {
      return NextResponse.json(
        { error: "기간은 30, 60, 90일만 선택 가능합니다" },
        { status: 400 }
      );
    }

    // 결제 수단은 위젯에서 선택하므로 서버에서는 placeholder로 저장 (confirm에서 실제 method로 갱신)

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
        // 카카오 알림톡은 현재 미구현 — 결제 차단
        if (optId === "KAKAO_ALERT") {
          return NextResponse.json(
            { error: "신규 이력서 알림은 현재 준비 중입니다" },
            { status: 400 }
          );
        }
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
    const orderId = `YSJ-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

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

    // 기존 PENDING 업그레이드 결제가 있으면 취소
    await prisma.payment.updateMany({
      where: {
        adId: ad.id,
        status: "PENDING",
      },
      data: { status: "CANCELLED", failReason: "새 업그레이드 요청으로 취소" },
    });

    const payment = await prisma.payment.create({
      data: {
        userId: session.user.id,
        adId: ad.id,
        orderId,
        amount: totalAmount,
        method: "BANK_TRANSFER" as PaymentMethod,
        status: "PENDING",
        itemSnapshot,
      },
    });

    // 관리자에게 알림 + 푸시 (fire and forget)
    prisma.user
      .findMany({ where: { role: "ADMIN" }, select: { id: true } })
      .then((admins) => {
        if (admins.length > 0) {
          prisma.notification.createMany({
            data: admins.map((admin) => ({
              userId: admin.id,
              title: "새 입금 대기 (업그레이드)",
              message: `${ad.businessName}에서 ${newProduct.name} 업그레이드 결제를 신청했습니다 (${totalAmount.toLocaleString()}원)`,
              link: "/admin/payments",
            })),
          }).catch(() => {});
          admins.forEach((admin) => {
            sendPushNotification(admin.id, {
              title: "새 입금 대기 (업그레이드)",
              body: `${ad.businessName}에서 ${newProduct.name} 업그레이드 결제를 신청했습니다 (${totalAmount.toLocaleString()}원)`,
              url: "/admin/payments",
            }).catch(() => {});
          });
        }
      })
      .catch(() => {});

    return NextResponse.json({
      adId: ad.id,
      orderId: payment.orderId,
      amount: totalAmount,
      orderName: `${newProduct.name} 업그레이드 (${durationDays}일)`,
    });
  } catch (error) {
    console.error("Ad upgrade error:", error);
    return NextResponse.json({ error: "업그레이드 요청에 실패했습니다" }, { status: 500 });
  }
}
