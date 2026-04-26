import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCronAuth } from "@/lib/utils/cron-auth";

/**
 * 만료 광고 처리 cron - 매시간 실행
 * endDate가 지난 유료 ACTIVE 광고를 무료(FREE) 상품으로 자동 전환
 * - status는 ACTIVE 유지 → 무료 영역에서 계속 노출
 * - productId = FREE, endDate = null (FREE는 기간 무제한)
 * - 자동/수동 점프는 FREE 기본값으로 재설정 (autoJumpPerDay=2, manualJumpPerDay=3)
 * - 사장이 다시 유료로 가려면 새 광고 등록 흐름 사용 (renew 페이지는 FREE 거부)
 * - 스탭 계정(isStaff=true) 광고는 제외 (auto-renew-staff 크론이 처리)
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
        user: { isStaff: false },
      },
      data: {
        productId: "FREE",
        endDate: null,
        autoJumpPerDay: 2,
        manualJumpPerDay: 3,
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
