import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { confirmTossPayment } from "@/lib/toss/confirm";
import { checkRateLimit } from "@/lib/rate-limit";
import { activateAd, sendPaymentNotification } from "@/lib/payment/activate-ad";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "BUSINESS") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    // #29: Rate limiting (분당 5회)
    const { success: rateLimitOk } = await checkRateLimit(`payment-confirm:${session.user.id}`, 5, 60_000);
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
    let tossResult;
    try {
      tossResult = await confirmTossPayment({ paymentKey, orderId, amount });
    } catch (error) {
      // Toss API 실패 시 lock 해제 (재시도 가능하게)
      await prisma.payment.update({
        where: { id: payment.id },
        data: { tossPaymentKey: null },
      });
      throw error;
    }

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

    // 가상계좌 결제인 경우: 입금 대기 상태로 처리
    if (tossResult.virtualAccount) {
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            method: "BANK_TRANSFER",
            tossPaymentKey: paymentKey,
            bankName: tossResult.virtualAccount!.bank,
            accountNumber: tossResult.virtualAccount!.accountNumber,
            depositorName: tossResult.virtualAccount!.customerName,
            // status는 PENDING 유지 (입금 확인 후 webhook에서 APPROVED로 변경)
          },
        });

        // Ad 상태를 PENDING_DEPOSIT로 변경 (renew/upgrade 시에도 입금대기 표시)
        if (payment.adId) {
          await tx.ad.update({
            where: { id: payment.adId },
            data: { status: "PENDING_DEPOSIT" },
          });
        }
      });

      return NextResponse.json({
        message: "가상계좌가 발급되었습니다",
        adId: payment.adId,
        orderId,
        virtualAccount: {
          bank: tossResult.virtualAccount.bank,
          accountNumber: tossResult.virtualAccount.accountNumber,
          customerName: tossResult.virtualAccount.customerName,
          dueDate: tossResult.virtualAccount.dueDate,
        },
      });
    }

    // 결제 방법 판별
    const isKakaoPay = tossResult.easyPay?.provider === "카카오페이";
    const method = isKakaoPay ? "KAKAO_PAY" : "CARD";

    const activationResult = await prisma.$transaction(async (tx) => {
      // Payment 승인 (카드 정보 포함)
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

      // 광고 활성화 (공통 함수)
      return activateAd(tx, payment, now);
    });

    // 결제 완료 알림
    if (activationResult) {
      await sendPaymentNotification(payment, "결제가 완료되었습니다", activationResult);
    }

    return NextResponse.json({
      message: "결제가 완료되었습니다",
      adId: payment.adId,
      orderId,
    });
  } catch (error) {
    console.error("Payment confirm error:", error);
    return NextResponse.json({ error: "결제 승인에 실패했습니다" }, { status: 500 });
  }
}
