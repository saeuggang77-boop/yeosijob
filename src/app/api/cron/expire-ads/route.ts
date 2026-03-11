import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCronAuth } from "@/lib/utils/cron-auth";

/**
 * 만료 광고 처리 cron - 매시간 실행
 * endDate가 지난 유료 ACTIVE 광고를 무료(FREE)로 자동 전환
 * - 유료 기능(자동점프/수동점프/수정횟수) 리셋
 * - endDate를 null로 변경 (무기한)
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
        productId: "FREE",
        autoJumpPerDay: 0,
        manualJumpPerDay: 3,
        manualJumpUsedToday: 0,
        maxEdits: 999,
        endDate: null,
      },
    });

    return NextResponse.json({
      message: "Expire-ads completed (converted to FREE)",
      converted: result.count,
    });
  } catch (error) {
    console.error("Expire-ads cron error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
