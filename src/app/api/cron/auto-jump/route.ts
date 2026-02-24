import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCronAuth } from "@/lib/utils/cron-auth";

/**
 * 자동점프 cron - 매 10분 실행
 * 영업시간(18:00~06:00 KST): 전체 점프의 70%
 * 비영업시간(06:00~18:00 KST): 전체 점프의 30%
 */
export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    // KST 시간 계산 (UTC+9)
    const kstHour = (now.getUTCHours() + 9) % 24;
    // 영업시간: 18:00~06:00 KST
    const isBusinessHours = kstHour >= 18 || kstHour < 6;

    // 10분 간격 = 하루 144 슬롯, 영업/비영업 각 72 슬롯

    // ACTIVE 광고 중 기간 내인 것 조회
    const ads = await prisma.ad.findMany({
      where: {
        status: "ACTIVE",
        startDate: { lte: now },
        endDate: { gte: now },
        autoJumpPerDay: { gt: 0 },
      },
      select: {
        id: true,
        userId: true,
        autoJumpPerDay: true,
        lastJumpedAt: true,
      },
    });

    let jumpCount = 0;

    // Batch process - 50건씩
    const BATCH_SIZE = 50;
    for (let batch = 0; batch < ads.length; batch += BATCH_SIZE) {
      const batchAds = ads.slice(batch, batch + BATCH_SIZE);

      await Promise.all(
        batchAds.map(async (ad) => {
          const jumpsInPeriod = isBusinessHours
            ? Math.ceil(ad.autoJumpPerDay * 0.7)
            : Math.floor(ad.autoJumpPerDay * 0.3);

          if (jumpsInPeriod === 0) return;

          const intervalMinutes = (12 * 60) / jumpsInPeriod;
          const minutesSinceLastJump =
            (now.getTime() - ad.lastJumpedAt.getTime()) / (1000 * 60);

          if (minutesSinceLastJump >= intervalMinutes) {
            await prisma.$transaction(async (tx) => {
              await tx.ad.update({
                where: { id: ad.id },
                data: { lastJumpedAt: now },
              });
              await tx.jumpLog.create({
                data: {
                  adId: ad.id,
                  userId: ad.userId,
                  type: "AUTO",
                  jumpedAt: now,
                },
              });
            });
            jumpCount++;
          }
        })
      );
    }

    return NextResponse.json({
      message: "Auto-jump completed",
      processed: ads.length,
      jumped: jumpCount,
      isBusinessHours,
      kstHour,
    });
  } catch (error) {
    console.error("Auto-jump cron error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
