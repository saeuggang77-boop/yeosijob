import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCronAuth } from "@/lib/utils/cron-auth";

/**
 * 미입금 48시간 자동 취소 cron - 매시간 실행
 * PENDING_DEPOSIT 상태로 48시간 이상 경과한 광고를 CANCELLED로 변경
 * 관련 PENDING 결제도 CANCELLED로 변경
 */
export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cutoff48h = new Date(Date.now() - 48 * 60 * 60 * 1000);

    // Payment.createdAt 기준으로 48시간 초과 PENDING 결제 조회
    const expiredPayments = await prisma.payment.findMany({
      where: {
        status: "PENDING",
        createdAt: { lt: cutoff48h },
      },
      select: { id: true, adId: true, partnerId: true },
    });

    if (expiredPayments.length === 0) {
      return NextResponse.json({
        message: "No pending deposits to cancel",
        cancelled: 0,
      });
    }

    const paymentIds = expiredPayments.map((p) => p.id);
    const adIds = expiredPayments
      .map((p) => p.adId)
      .filter((id): id is string => id !== null);
    const partnerIds = expiredPayments
      .map((p) => p.partnerId)
      .filter((id): id is string => id !== null);

    await prisma.$transaction(async (tx) => {
      // 결제 취소
      await tx.payment.updateMany({
        where: { id: { in: paymentIds } },
        data: {
          status: "CANCELLED",
          failReason: "48시간 미입금 자동 취소",
        },
      });

      // 관련 광고 취소 (PENDING_DEPOSIT 상태인 경우만)
      if (adIds.length > 0) {
        await tx.ad.updateMany({
          where: {
            id: { in: adIds },
            status: "PENDING_DEPOSIT",
          },
          data: { status: "CANCELLED" },
        });
      }

      // 관련 제휴업체도 취소 (PENDING_PAYMENT 상태인 경우만)
      if (partnerIds.length > 0) {
        await tx.partner.updateMany({
          where: {
            id: { in: partnerIds },
            status: "PENDING_PAYMENT",
          },
          data: { status: "CANCELLED" },
        });
      }
    });

    return NextResponse.json({
      message: "Expire-pending completed",
      cancelledPayments: paymentIds.length,
      cancelledAds: adIds.length,
      cancelledPartners: partnerIds.length,
    });
  } catch (error) {
    console.error("Expire-pending cron error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
