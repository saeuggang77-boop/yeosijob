import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { activateAd, sendPaymentNotification } from "@/lib/payment/activate-ad";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    const { id } = await params;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { ad: true, partner: true },
    });

    if (!payment) {
      return NextResponse.json({ error: "결제를 찾을 수 없습니다" }, { status: 404 });
    }

    if (payment.status !== "PENDING") {
      return NextResponse.json(
        { error: `이미 처리된 결제입니다 (${payment.status})` },
        { status: 400 }
      );
    }

    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      // Payment 승인
      await tx.payment.update({
        where: { id },
        data: {
          status: "APPROVED",
          paidAt: now,
        },
      });

      // 광고 활성화
      if (payment.adId && payment.ad) {
        return { type: "ad" as const, activation: await activateAd(tx, payment, now) };
      }

      // 제휴업체 활성화
      if (payment.partnerId && payment.partner) {
        const durationDays = payment.partner.durationDays || 30;
        const endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
        await tx.partner.update({
          where: { id: payment.partnerId },
          data: {
            status: "ACTIVE",
            startDate: now,
            endDate,
          },
        });
        return { type: "partner" as const, endDate, durationDays };
      }

      return null;
    });

    // 알림 발송
    if (result?.type === "ad" && result.activation) {
      await sendPaymentNotification(payment, "입금이 확인되었습니다", result.activation);
    } else if (result?.type === "partner" && payment.partner) {
      await prisma.notification.create({
        data: {
          userId: payment.userId,
          title: "입금이 확인되었습니다",
          message: `'${payment.partner.name}' 제휴업체가 활성화되었습니다. 기간: ${result.durationDays}일`,
          link: "/business/partner",
        },
      });
    }

    return NextResponse.json({
      message: "입금이 확인되었습니다",
      paymentId: id,
      adId: payment.adId,
      partnerId: payment.partnerId,
      startDate: now.toISOString(),
      endDate: result?.type === "ad"
        ? (result.activation?.endDate.toISOString() ?? now.toISOString())
        : result?.type === "partner"
          ? result.endDate.toISOString()
          : now.toISOString(),
    });
  } catch (error) {
    console.error("Payment approve error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
