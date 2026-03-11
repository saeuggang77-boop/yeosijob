import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { confirmTossPayment } from "@/lib/toss/confirm";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
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

    // Verify amount
    if (payment.amount !== amount) {
      return NextResponse.json({ error: "결제 금액이 일치하지 않습니다" }, { status: 400 });
    }

    // Verify token matches
    if (payment.partner?.paymentToken !== token) {
      return NextResponse.json({ error: "유효하지 않은 결제 토큰입니다" }, { status: 400 });
    }

    // Confirm payment with Toss
    await confirmTossPayment({ paymentKey, orderId, amount });

    // Update payment status
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "APPROVED",
        tossPaymentKey: paymentKey,
        paidAt: new Date(),
      },
    });

    // Update partner status and dates
    const partner = payment.partner!;
    const now = new Date();
    // For renewals: extend from current endDate if still in the future
    const baseDate = partner.status === "ACTIVE" && partner.endDate && partner.endDate > now
      ? partner.endDate
      : now;
    const newEndDate = new Date(baseDate);
    newEndDate.setDate(newEndDate.getDate() + partner.durationDays);

    await prisma.partner.update({
      where: { id: payment.partnerId! },
      data: {
        status: "ACTIVE",
        startDate: partner.startDate || now,
        endDate: newEndDate,
      },
    });

    return NextResponse.json({
      success: true,
      message: "결제가 완료되었습니다",
    });
  } catch (error) {
    console.error("Partner payment confirmation error:", error);
    return NextResponse.json({ error: "결제 승인 실패" }, { status: 500 });
  }
}
