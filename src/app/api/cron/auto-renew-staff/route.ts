import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCronAuth } from "@/lib/utils/cron-auth";

/**
 * 스탭 계정 광고 자동 갱신 cron - 매일 새벽 2시 실행
 * - D-1인 스탭 광고(endDate가 내일~모레 사이)를 찾아 +90일 연장
 * - autoRenewCount 증가 (최대 3회, 총 약 360일 후 정말 만료)
 * - AdOption endDate도 같이 연장
 * - Step 4 덕분에 expire-ads가 스탭 광고를 건드리지 않으므로 타이밍 충돌 없음
 */
const MAX_AUTO_RENEW = 3;
const RENEW_DAYS = 90;

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(now);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

    // 스탭 광고 중 D-1인 것 찾기 (endDate가 내일 ~ 모레 사이)
    const adsToRenew = await prisma.ad.findMany({
      where: {
        status: "ACTIVE",
        autoRenewCount: { lt: MAX_AUTO_RENEW },
        endDate: {
          gte: tomorrow,
          lt: dayAfterTomorrow,
        },
        user: {
          isStaff: true,
        },
      },
      select: { id: true, endDate: true, autoRenewCount: true },
    });

    let renewedCount = 0;
    for (const ad of adsToRenew) {
      if (!ad.endDate) continue;
      const newEndDate = new Date(ad.endDate);
      newEndDate.setDate(newEndDate.getDate() + RENEW_DAYS);

      await prisma.$transaction([
        prisma.ad.update({
          where: { id: ad.id },
          data: {
            endDate: newEndDate,
            autoRenewCount: { increment: 1 },
            lastAutoRenewedAt: now,
          },
        }),
        // AdOption도 같이 연장
        prisma.adOption.updateMany({
          where: { adId: ad.id },
          data: { endDate: newEndDate },
        }),
      ]);
      renewedCount++;
    }

    return NextResponse.json({
      success: true,
      renewedCount,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Auto-renew-staff cron error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
