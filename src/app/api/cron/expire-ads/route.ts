import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCronAuth } from "@/lib/utils/cron-auth";

const FREE_EXPIRY_DAYS = 90;

/**
 * 만료 광고 처리 cron - 매시간 실행
 *
 * 1. 유료 ACTIVE → 무료(FREE) 자동 전환 (endDate 경과 시)
 *    - status는 ACTIVE 유지 → 무료 영역에서 계속 노출
 *    - productId = FREE, endDate = null (FREE는 기간 무제한)
 *    - 자동/수동 점프는 FREE 기본값으로 재설정
 *    - 스탭 계정(isStaff=true) 광고는 제외 (auto-renew-staff 크론이 처리)
 *
 * 2. 무료광고 미활동 만료 처리 (사장님 90일 미접속)
 *    - 사장의 lastBusinessActivityAt이 90일 이상 경과한 ACTIVE FREE 광고 → EXPIRED
 *    - 스탭 계정 제외
 *    - 사전에 D-7 SMS 발송 (notify-free-expiry 크론)
 */
export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const inactivityCutoff = new Date(now.getTime() - FREE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    const [paidToFree, freeExpired] = await Promise.all([
      // 1. 유료 만료 → FREE 전환
      prisma.ad.updateMany({
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
      }),
      // 2. 무료광고 90일 미활동 → EXPIRED (시드 데이터/스탭 제외)
      prisma.ad.updateMany({
        where: {
          status: "ACTIVE",
          productId: "FREE",
          user: {
            role: "BUSINESS",
            isStaff: false,
            isGhost: false,
            lastBusinessActivityAt: { lt: inactivityCutoff },
          },
        },
        data: { status: "EXPIRED" },
      }),
    ]);

    return NextResponse.json({
      message: "Expire-ads completed",
      paidToFree: paidToFree.count,
      freeExpired: freeExpired.count,
    });
  } catch (error) {
    console.error("Expire-ads cron error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
