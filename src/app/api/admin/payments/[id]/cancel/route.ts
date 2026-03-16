import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/sms";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    const { id } = await params;

    // 선택적으로 취소 사유 / 환불 정보를 받음
    let reason = "관리자 수동 취소";
    let isRefund = false;
    let refundAmount: number | null = null;
    try {
      const body = await request.json();
      if (body.reason) reason = body.reason;
      if (body.isRefund) isRefund = true;
      if (body.refundAmount) refundAmount = Number(body.refundAmount);
    } catch {
      // body가 없어도 OK — 기존 호출 호환
    }

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        ad: true,
        user: { select: { id: true, phone: true } },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "결제를 찾을 수 없습니다" }, { status: 404 });
    }

    if (payment.status !== "PENDING") {
      return NextResponse.json(
        { error: `입금대기 상태만 취소할 수 있습니다 (현재: ${payment.status})` },
        { status: 400 }
      );
    }

    // failReason에 환불 정보 포함
    const failReason = isRefund
      ? `환불: ${refundAmount?.toLocaleString() ?? 0}원 | ${reason}`
      : reason;

    // DB 취소 처리 + 알림 생성
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id },
        data: {
          status: "CANCELLED",
          failReason,
        },
      });

      // 관련 광고도 취소 (PENDING_DEPOSIT 또는 PENDING_PAYMENT 상태인 경우)
      if (
        payment.adId &&
        payment.ad &&
        ["PENDING_DEPOSIT", "PENDING_PAYMENT"].includes(payment.ad.status)
      ) {
        await tx.ad.update({
          where: { id: payment.adId },
          data: { status: "CANCELLED" },
        });
      }

      // 사용자에게 사이트 내 알림 생성
      if (payment.userId) {
        await tx.notification.create({
          data: {
            userId: payment.userId,
            title: isRefund ? "환불 처리되었습니다" : "결제가 취소되었습니다",
            message: `주문번호 ${payment.orderId}의 ${isRefund ? "환불이" : "결제가 취소"} 처리되었습니다. 사유: ${reason}`,
            link: "/business/payments",
          },
        });
      }
    });

    // SMS 발송 (fire-and-forget — 실패해도 취소 처리는 정상 완료)
    if (payment.user?.phone) {
      const smsText = isRefund
        ? `[여시알바] 환불 처리 완료\n주문번호: ${payment.orderId}\n환불금액: ${refundAmount?.toLocaleString() ?? 0}원\n사유: ${reason}`
        : `[여시알바] 결제가 취소되었습니다.\n주문번호: ${payment.orderId}\n사유: ${reason}`;
      sendSms(payment.user.phone, smsText).catch(() => {});
    }

    return NextResponse.json({
      message: isRefund ? "환불 처리되었습니다" : "결제가 취소되었습니다",
      paymentId: id,
      adId: payment.adId,
    });
  } catch (error) {
    console.error("Payment cancel error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
