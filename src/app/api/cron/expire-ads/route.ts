import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCronAuth } from "@/lib/utils/cron-auth";

/**
 * 만료 광고 처리 cron - 매시간 실행
 * endDate가 지난 유료 ACTIVE 광고를 EXPIRED 상태로 전환
 * - productId는 유지 (연장 시 동일 상품으로 결제할 수 있도록)
 * - 유료 기능(자동점프) 중지
 */
export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    const result = await prisma.ad.updateMany({
      where: {
        status: "ACTIVE",
        productId: { not: "FREE" },
        endDate: { lt: now },
      },
      data: {
        status: "EXPIRED",
        autoJumpPerDay: 0,
        manualJumpPerDay: 0,
        manualJumpUsedToday: 0,
      },
    });

    return NextResponse.json({
      message: "Expire-ads completed",
      expired: result.count,
    });
  } catch (error) {
    console.error("Expire-ads cron error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
