import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCronAuth } from "@/lib/utils/cron-auth";
import { sendAdExpiryNotification } from "@/lib/email";
import { sendSms } from "@/lib/sms";

/**
 * 광고/제휴업체 만료 알림 cron - 매일 1회 실행 (09:00 KST)
 * D-3, D-1, D-0 만료 예정 광고 + 제휴업체에 이메일/사이트 알림 발송
 */
export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const results = { adNotified: 0, partnerNotified: 0, smsSent: 0, errors: 0 };
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // D-3, D-1, D-0 체크
    for (const daysLeft of [3, 1, 0]) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + daysLeft);

      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      // ── 구인광고(Ad) 만료 알림 ──
      // 스탭 계정 광고는 제외 (운영자=본인에게 알림 불필요)
      const expiringAds = await prisma.ad.findMany({
        where: {
          status: "ACTIVE",
          productId: { not: "FREE" },
          endDate: { gte: startOfDay, lte: endOfDay },
          user: { isStaff: false },
        },
        select: {
          id: true,
          title: true,
          businessName: true,
          contactPhone: true,
          userId: true,
          user: { select: { email: true, phone: true } },
        },
      });

      for (const ad of expiringAds) {
        if (!ad.user.email) continue;

        const notificationLink = daysLeft === 0 ? `/business/ads/${ad.id}/renew` : `/business/ads/${ad.id}`;
        const existingNotification = await prisma.notification.findFirst({
          where: {
            userId: ad.userId,
            title: daysLeft === 0 ? "광고가 만료되었습니다" : `광고 만료 D-${daysLeft}`,
            link: notificationLink,
            createdAt: { gte: twentyFourHoursAgo },
          },
        });

        if (existingNotification) continue;

        try {
          await sendAdExpiryNotification(ad.user.email, ad.title, daysLeft, ad.id);

          const notificationMessage = daysLeft === 3
            ? `광고 '${ad.businessName}'이 3일 후 만료됩니다. 갱신하시겠습니까?`
            : `'${ad.title}' 광고가 ${daysLeft === 0 ? "오늘 만료됩니다" : `${daysLeft}일 후 만료됩니다`}`;

          await prisma.notification.create({
            data: {
              userId: ad.userId,
              title: daysLeft === 0 ? "광고가 만료되었습니다" : `광고 만료 D-${daysLeft}`,
              message: notificationMessage,
              link: notificationLink,
            },
          });

          // D-1일 때만 SMS 발송
          if (daysLeft === 1) {
            const adPhone = (ad.contactPhone || ad.user.phone)?.replace(/[^0-9]/g, "");
            if (adPhone) {
              sendSms(adPhone, `[여시잡] '${ad.businessName}' 광고가 내일 만료됩니다. 연장하시려면 여시잡에서 확인해주세요.`, "[여시잡] 만료안내").catch(() => {});
              results.smsSent++;
            }
          }

          results.adNotified++;
        } catch (error) {
          console.error(`Failed to send expiry notification for ad ${ad.id}:`, error);
          results.errors++;
        }
      }

      // ── 제휴업체(Partner) 만료 알림 ──
      const expiringPartners = await prisma.partner.findMany({
        where: {
          status: "ACTIVE",
          endDate: { gte: startOfDay, lte: endOfDay },
        },
        select: {
          id: true,
          name: true,
          contactPhone: true,
          userId: true,
          user: { select: { email: true, phone: true } },
        },
      });

      for (const partner of expiringPartners) {
        if (!partner.user.email) continue;

        const partnerLink = `/business/partner`;
        const partnerTitle = daysLeft === 0 ? "제휴업체 광고가 만료되었습니다" : `제휴업체 만료 D-${daysLeft}`;
        const existingNotification = await prisma.notification.findFirst({
          where: {
            userId: partner.userId,
            title: partnerTitle,
            createdAt: { gte: twentyFourHoursAgo },
          },
        });

        if (existingNotification) continue;

        try {
          // 이메일 알림 (구인광고 이메일 함수 재활용 - 제휴업체명으로)
          await sendAdExpiryNotification(partner.user.email, partner.name, daysLeft, partner.id);

          // 사이트 내 알림
          const daysText = daysLeft === 0 ? "오늘 만료됩니다" : `${daysLeft}일 후 만료됩니다`;
          await prisma.notification.create({
            data: {
              userId: partner.userId,
              title: partnerTitle,
              message: `제휴업체 '${partner.name}' 광고가 ${daysText}. 연장을 원하시면 문의해주세요.`,
              link: partnerLink,
            },
          });

          // D-1일 때만 SMS 발송
          if (daysLeft === 1) {
            const partnerPhone = (partner.contactPhone || partner.user.phone)?.replace(/[^0-9]/g, "");
            if (partnerPhone) {
              sendSms(partnerPhone, `[여시잡] '${partner.name}' 제휴업체 광고가 내일 만료됩니다. 연장하시려면 여시잡에서 확인해주세요.`, "[여시잡] 만료안내").catch(() => {});
              results.smsSent++;
            }
          }

          results.partnerNotified++;
        } catch (error) {
          console.error(`Failed to send expiry notification for partner ${partner.id}:`, error);
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
