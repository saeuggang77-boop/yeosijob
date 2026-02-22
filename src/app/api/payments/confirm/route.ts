import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { confirmTossPayment } from "@/lib/toss/confirm";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "BUSINESS") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
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

    // Toss API 승인 요청
    const tossResult = await confirmTossPayment({ paymentKey, orderId, amount });

    const now = new Date();
    const durationDays = payment.ad?.durationDays || 30;
    const endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

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

      // Ad 활성화
      if (payment.adId) {
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
