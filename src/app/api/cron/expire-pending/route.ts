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
    const cutoff7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // 미입금 광고 조회 (가상계좌: 7일, 그 외: 48시간)
    const expiredAds = await prisma.ad.findMany({
      where: {
        status: "PENDING_DEPOSIT",
        OR: [
          // 가상계좌 결제: 7일 초과
          {
            createdAt: { lt: cutoff7d },
            payments: { some: { method: "BANK_TRANSFER", status: "PENDING" } },
          },
          // 그 외 결제: 48시간 초과
          {
            createdAt: { lt: cutoff48h },
            payments: { none: { method: "BANK_TRANSFER", status: "PENDING" } },
          },
        ],
      },
      select: { id: true },
    });

    if (expiredAds.length === 0) {
      return NextResponse.json({
        message: "No pending deposits to cancel",
        cancelled: 0,
      });
    }

    const adIds = expiredAds.map((a) => a.id);

    await prisma.$transaction(async (tx) => {
      // 광고 취소
      await tx.ad.updateMany({
        where: { id: { in: adIds } },
        data: { status: "CANCELLED" },
      });

      // 관련 결제 취소
      await tx.payment.updateMany({
        where: {
          adId: { in: adIds },
          status: "PENDING",
        },
        data: {
          status: "CANCELLED",
          failReason: "48시간 미입금 자동 취소",
        },
      });
    });

    return NextResponse.json({
      message: "Expire-pending completed",
      cancelled: expiredAds.length,
    });
  } catch (error) {
    console.error("Expire-pending cron error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
