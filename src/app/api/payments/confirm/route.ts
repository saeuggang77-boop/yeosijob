import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { confirmTossPayment } from "@/lib/toss/confirm";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "BUSINESS") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    // #29: Rate limiting (분당 5회)
    const { success: rateLimitOk } = checkRateLimit(`payment-confirm:${session.user.id}`, 5, 60_000);
    if (!rateLimitOk) {
      return NextResponse.json({ error: "너무 많은 요청입니다. 잠시 후 다시 시도해주세요" }, { status: 429 });
    }

    const { paymentKey, orderId, amount } = await request.json();

    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json(
        { error: "필수 파라미터가 없습니다" },
        { status: 400 }
      );
    }

    // DB에서 결제 조회
    const payment = await prisma.payment.findUnique({
      where: { orderId },
      include: { ad: true },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "결제 정보를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    if (payment.userId !== session.user.id) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    if (payment.status !== "PENDING") {
      return NextResponse.json(
        { error: "이미 처리된 결제입니다" },
        { status: 400 }
      );
    }

    // 금액 검증
    if (payment.amount !== amount) {
      return NextResponse.json(
        { error: "결제 금액이 일치하지 않습니다" },
        { status: 400 }
      );
    }

    // #19: 이중 결제 방지 - atomic PENDING 상태 확인
    const lockResult = await prisma.payment.updateMany({
      where: { id: payment.id, status: "PENDING" },
      data: { tossPaymentKey: paymentKey },
    });
    if (lockResult.count === 0) {
      return NextResponse.json(
        { error: "이미 처리 중인 결제입니다" },
        { status: 400 }
      );
    }

    // Toss API 승인 요청
    const tossResult = await confirmTossPayment({ paymentKey, orderId, amount });

    // #3: Toss 결제 금액 재검증
    if (tossResult.totalAmount !== payment.amount) {
      console.error(
        `Payment amount mismatch: toss=${tossResult.totalAmount}, db=${payment.amount}, orderId=${orderId}`
      );
      return NextResponse.json(
        { error: "결제 금액이 일치하지 않습니다" },
        { status: 400 }
      );
    }

    const now = new Date();

    // 결제 방법 판별
    const isKakaoPay = tossResult.easyPay?.provider === "카카오페이";
    const method = isKakaoPay ? "KAKAO_PAY" : "CARD";

    await prisma.$transaction(async (tx) => {
      // Payment 승인
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "APPROVED",
          method,
          tossPaymentKey: paymentKey,
          cardCompany: tossResult.card?.company || tossResult.easyPay?.provider || null,
          cardNumber: tossResult.card?.number || null,
          receiptUrl: tossResult.receipt?.url || tossResult.card?.receiptUrl || null,
          paidAt: now,
        },
      });

      // Ad 활성화 또는 업그레이드/연장
      if (payment.adId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const snapshot = payment.itemSnapshot as any;
        const isUpgrade = snapshot?.type === "upgrade";
        const isRenew = snapshot?.type === "renew";

        // 업그레이드/연장: snapshot.duration 사용, 일반: 기존 ad.durationDays 사용
        const durationDays = (isUpgrade || isRenew)
          ? snapshot.duration
          : (payment.ad?.durationDays || 30);
        const endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

        if (isUpgrade || isRenew) {
          // 기존 옵션 삭제
          await tx.adOption.deleteMany({
            where: { adId: payment.adId },
          });

          // 새 옵션 생성
          if (snapshot.options && Array.isArray(snapshot.options)) {
            for (const opt of snapshot.options) {
              await tx.adOption.create({
                data: {
                  adId: payment.adId,
                  optionId: opt.id,
                  value: opt.value,
                  durationDays: snapshot.duration,
                  startDate: now,
                  endDate,
                },
              });
            }
          }

          // 광고 업그레이드/연장
          await tx.ad.update({
            where: { id: payment.adId },
            data: {
              status: "ACTIVE",
              productId: snapshot.product.id,
              durationDays: snapshot.duration,
              totalAmount: isRenew ? amount : { increment: amount },
              autoJumpPerDay: snapshot.newFeatures.autoJumpPerDay,
              manualJumpPerDay: snapshot.newFeatures.manualJumpPerDay,
              maxEdits: snapshot.newFeatures.maxEdits,
              startDate: now,
              endDate,
              lastJumpedAt: now,
              manualJumpUsedToday: 0,
              editCount: 0,
            },
          });
        } else {
          // 일반 광고 활성화
          await tx.ad.update({
            where: { id: payment.adId },
            data: {
              status: "ACTIVE",
              startDate: now,
              endDate,
              lastJumpedAt: now,
            },
          });
        }
      }
    });

    return NextResponse.json({
      message: "결제가 완료되었습니다",
      adId: payment.adId,
      orderId,
    });
  } catch (error) {
    console.error("Payment confirm error:", error);
    const message =
      error instanceof Error ? error.message : "결제 승인에 실패했습니다";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
