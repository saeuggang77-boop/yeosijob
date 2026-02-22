import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCronAuth } from "@/lib/utils/cron-auth";

/**
 * 만료 광고 처리 cron - 매시간 실행
 * endDate가 지난 ACTIVE 광고를 EXPIRED로 변경
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
        endDate: { lt: now },
      },
      data: {
        status: "EXPIRED",
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
