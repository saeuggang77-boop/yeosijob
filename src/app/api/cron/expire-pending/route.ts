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
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);

    // 48시간 초과 미입금 광고 조회
    const expiredAds = await prisma.ad.findMany({
      where: {
        status: "PENDING_DEPOSIT",
        createdAt: { lt: cutoff },
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
