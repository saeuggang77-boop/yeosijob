import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TOSS_API_URL, TOSS_SECRET_KEY, assertTossKeys } from "@/lib/toss/client";
import { checkRateLimit } from "@/lib/rate-limit";
import { activateAd, sendPaymentNotification } from "@/lib/payment/activate-ad";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: IP 기준 분당 30회 (웹훅 남용 방지)
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const { success: rateLimitOk } = await checkRateLimit(`webhook:${ip}`, 30, 60_000);
    if (!rateLimitOk) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await request.json();
    const { eventType, data } = body;

    // Only handle deposit events
    if (eventType !== "PAYMENT_STATUS_CHANGED") {
      return NextResponse.json({ ok: true });
    }

    const { paymentKey, orderId, status } = data;

    if (status !== "DONE") {
      return NextResponse.json({ ok: true });
    }

    // Early idempotency: DB에서 먼저 확인하여 불필요한 Toss API 호출 방지
    const payment = await prisma.payment.findUnique({
      where: { tossPaymentKey: paymentKey },
      include: { ad: true },
    });

    if (!payment) {
      console.error(`Webhook: payment not found for paymentKey ${paymentKey}`);
      return NextResponse.json({ ok: true });
    }

    // Already processed - Toss API 호출 없이 바로 반환
    if (payment.status === "APPROVED") {
      return NextResponse.json({ ok: true });
    }

    // orderId 일치 확인
    if (payment.orderId !== orderId) {
      console.error(`Webhook: orderId mismatch. DB=${payment.orderId}, webhook=${orderId}`);
      return NextResponse.json({ error: "orderId mismatch" }, { status: 400 });
    }

    // Verify with Toss API
    assertTossKeys();
    const auth = Buffer.from(`${TOSS_SECRET_KEY}:`).toString("base64");
    const tossRes = await fetch(`${TOSS_API_URL}/payments/${paymentKey}`, {
      headers: { Authorization: `Basic ${auth}` },
    });

    if (!tossRes.ok) {
      console.error("Toss payment verification failed");
      return NextResponse.json({ error: "verification failed" }, { status: 400 });
    }

    const tossPayment = await tossRes.json();

    if (tossPayment.status !== "DONE") {
      return NextResponse.json({ ok: true }); // Not yet done
    }

    // Toss 응답 금액 검증
    if (tossPayment.totalAmount !== payment.amount) {
      console.error(`Webhook: amount mismatch. toss=${tossPayment.totalAmount}, db=${payment.amount}`);
      return NextResponse.json({ error: "amount mismatch" }, { status: 400 });
    }

    const now = new Date();
    const activationResult = await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "APPROVED",
          paidAt: now,
        },
      });

      // 광고 활성화 (공통 함수)
      return activateAd(tx, payment, now);
    });

    // 입금 확인 알림
    if (activationResult) {
      await sendPaymentNotification(payment, "입금이 확인되었습니다", activationResult);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
