import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { confirmTossPayment } from "@/lib/toss/confirm";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Rate limiting: IP 기준 분당 5회
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const { success: rateLimitOk } = await checkRateLimit(`partner-confirm:${ip}`, 5, 60_000);
    if (!rateLimitOk) {
      return NextResponse.json({ error: "너무 많은 요청입니다. 잠시 후 다시 시도해주세요" }, { status: 429 });
    }

    const body = await request.json();
    const { paymentKey, orderId, amount } = body;

    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json({ error: "필수 필드가 누락되었습니다" }, { status: 400 });
    }

    // Find payment record
    const payment = await prisma.payment.findUnique({
      where: { orderId },
      include: { partner: true },
    });

    if (!payment) {
      return NextResponse.json({ error: "결제 정보를 찾을 수 없습니다" }, { status: 404 });
    }

    // Idempotency: 이미 처리된 결제
    if (payment.status === "APPROVED") {
      return NextResponse.json({
        success: true,
        message: "이미 처리된 결제입니다",
        partnerId: payment.partnerId,
      });
    }

    if (payment.status !== "PENDING") {
      return NextResponse.json({ error: "처리할 수 없는 결제 상태입니다" }, { status: 400 });
    }

    // Verify amount
    if (payment.amount !== amount) {
      return NextResponse.json({ error: "결제 금액이 일치하지 않습니다" }, { status: 400 });
    }

    // Verify token matches
    if (payment.partner?.paymentToken !== token) {
      return NextResponse.json({ error: "유효하지 않은 결제 토큰입니다" }, { status: 400 });
    }

    // 이중 결제 방지 - atomic lock
    const lockResult = await prisma.payment.updateMany({
      where: { id: payment.id, status: "PENDING" },
      data: { tossPaymentKey: paymentKey },
    });
    if (lockResult.count === 0) {
      return NextResponse.json({ error: "이미 처리 중인 결제입니다" }, { status: 400 });
    }

    // Confirm payment with Toss
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

    // Toss 응답 금액 재검증
    if (tossResult.totalAmount !== payment.amount) {
      console.error(`Partner confirm: amount mismatch. toss=${tossResult.totalAmount}, db=${payment.amount}`);
      return NextResponse.json({ error: "결제 금액이 일치하지 않습니다" }, { status: 400 });
    }

    // Update payment status
    const now = new Date();
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "APPROVED",
        tossPaymentKey: paymentKey,
        paidAt: now,
      },
    });

    // Update partner status and dates
    const partner = payment.partner!;

    // 연장 결제: 기존 endDate가 유효하면 연장
    if (partner.status === "ACTIVE" && partner.endDate && partner.endDate > now) {
      const newEndDate = new Date(partner.endDate);
      newEndDate.setDate(newEndDate.getDate() + partner.durationDays);
      await prisma.partner.update({
        where: { id: payment.partnerId! },
        data: { endDate: newEndDate },
      });
    } else {
      // 신규 결제: startDate 기록 (3일 자동시작 기준), endDate는 프로필 완성 시 설정
      await prisma.partner.update({
        where: { id: payment.partnerId! },
        data: {
          status: "ACTIVE",
          startDate: now,
          endDate: null,
        },
      });
    }

    revalidatePath("/partner");

    return NextResponse.json({
      success: true,
      message: "결제가 완료되었습니다",
      partnerId: payment.partnerId,
    });
  } catch (error) {
    console.error("Partner payment confirmation error:", error);
    return NextResponse.json({ error: "결제 승인 실패" }, { status: 500 });
  }
}
