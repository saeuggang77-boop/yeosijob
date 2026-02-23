import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCronAuth } from "@/lib/utils/cron-auth";
import { sendAdExpiryNotification } from "@/lib/email";

/**
 * 광고 만료 알림 cron - 매일 1회 실행
 * D-3, D-1, D-0 만료 예정 광고에 이메일 알림 발송
 */
export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const results = { notified: 0, errors: 0 };

    // D-3, D-1, D-0 체크
    for (const daysLeft of [3, 1, 0]) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + daysLeft);

      // 해당 날짜에 만료되는 ACTIVE 광고 조회
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const expiringAds = await prisma.ad.findMany({
        where: {
          status: "ACTIVE",
          endDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        select: {
          id: true,
          title: true,
          userId: true,
          user: {
            select: { email: true },
          },
        },
      });

      for (const ad of expiringAds) {
        if (!ad.user.email) continue;

        try {
          await sendAdExpiryNotification(
            ad.user.email,
            ad.title,
            daysLeft,
            ad.id,
          );

          // Create in-app notification
          await prisma.notification.create({
            data: {
              userId: ad.userId,
              title: daysLeft === 0 ? "광고가 만료되었습니다" : `광고 만료 D-${daysLeft}`,
              message: `'${ad.title}' 광고가 ${daysLeft === 0 ? "오늘 만료됩니다" : `${daysLeft}일 후 만료됩니다`}`,
              link: `/business/ads/${ad.id}`,
            },
          });

          results.notified++;
        } catch (error) {
          console.error(`Failed to send expiry notification for ad ${ad.id}:`, error);
          results.errors++;
        }
      }
    }

    return NextResponse.json({
      message: "Notify-expiry completed",
      ...results,
    });
  } catch (error) {
    console.error("Notify-expiry cron error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
