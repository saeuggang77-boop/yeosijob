import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCronAuth } from "@/lib/utils/cron-auth";
import { activateAd } from "@/lib/payment/activate-ad";

/**
 * 만료 광고 처리 cron - 매시간 실행
 * endDate가 지난 유료 ACTIVE 광고를 EXPIRED 상태로 전환
 * - 승인된 업그레이드 결제가 있으면 새 등급으로 자동 전환 (B안)
 * - productId는 유지 (연장 시 동일 상품으로 결제할 수 있도록)
 * - 유료 기능(자동점프) 중지
 */
export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    // 만료 대상 광고 조회
    const expiredAds = await prisma.ad.findMany({
      where: {
        status: "ACTIVE",
        productId: { not: "FREE" },
        endDate: { lt: now },
      },
      select: { id: true, userId: true, title: true, durationDays: true, productId: true },
    });

    let expired = 0;
    let upgraded = 0;

    for (const ad of expiredAds) {
      // 승인된 업그레이드 결제가 있는지 확인
      const upgradePayment = await prisma.payment.findFirst({
        where: {
          adId: ad.id,
          status: "APPROVED",
          itemSnapshot: { path: ["type"], equals: "upgrade" },
        },
        orderBy: { createdAt: "desc" },
        include: { ad: true },
      });

      if (upgradePayment && upgradePayment.ad) {
        // 업그레이드 결제 있음 → 새 등급으로 자동 전환
        const snapshot = upgradePayment.itemSnapshot as Record<string, unknown>;
        const productName = (snapshot?.product as { name?: string })?.name || "상위 등급";

        await prisma.$transaction(async (tx) => {
          await activateAd(tx, upgradePayment, now);
        });

        // 자동 전환 알림
        await prisma.notification.create({
          data: {
            userId: ad.userId,
            title: "광고가 업그레이드되었습니다",
            message: `'${ad.title}' 광고가 ${productName}으로 자동 전환되었습니다.`,
            link: "/business/dashboard",
          },
        }).catch(() => {}); // 알림 실패해도 크론 중단하지 않음

        upgraded++;
      } else {
        // 업그레이드 없음 → 기존대로 EXPIRED 처리
        await prisma.ad.update({
          where: { id: ad.id },
          data: {
            status: "EXPIRED",
            autoJumpPerDay: 0,
            manualJumpPerDay: 0,
            manualJumpUsedToday: 0,
          },
        });
        expired++;
      }
    }

    return NextResponse.json({
      message: "Expire-ads completed",
      expired,
      upgraded,
    });
  } catch (error) {
    console.error("Expire-ads cron error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
