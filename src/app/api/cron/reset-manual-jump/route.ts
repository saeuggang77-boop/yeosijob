import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCronAuth } from "@/lib/utils/cron-auth";

/**
 * 수동점프 일일 리셋 cron - 매일 00:00 KST 실행
 * ACTIVE 광고의 manualJumpUsedToday를 0으로 초기화
 */
export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await prisma.ad.updateMany({
      where: {
        status: "ACTIVE",
        manualJumpPerDay: { gt: 0 },
      },
      data: {
        manualJumpUsedToday: 0,
      },
    });

    return NextResponse.json({
      message: "Reset-manual-jump completed",
      reset: result.count,
    });
  } catch (error) {
    console.error("Reset-manual-jump cron error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
