import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendPushNotification } from "@/lib/push-notification";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const { success } = await checkRateLimit(`scrap:${session.user.id}`, 20, 60_000);
    if (!success) {
      return NextResponse.json({ error: "너무 많은 요청입니다. 잠시 후 다시 시도해주세요" }, { status: 429 });
    }

    if (session.user.role !== "JOBSEEKER") {
      return NextResponse.json(
        { error: "구직자만 스크랩할 수 있습니다" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { adId } = body;

    if (!adId) {
      return NextResponse.json(
        { error: "채용 공고 ID가 필요합니다" },
        { status: 400 }
      );
    }

    // Check if ad exists
    const ad = await prisma.ad.findUnique({
      where: { id: adId },
      select: {
        id: true,
        userId: true,
        title: true,
        status: true,
        lastScrapMilestone: true,
      },
    });

    if (!ad) {
      return NextResponse.json(
        { error: "존재하지 않는 채용 공고입니다" },
        { status: 404 }
      );
    }

    // Toggle scrap
    const existingScrap = await prisma.scrap.findUnique({
      where: {
        userId_adId: {
          userId: session.user.id,
          adId,
        },
      },
    });

    if (existingScrap) {
      // Remove scrap
      await prisma.scrap.delete({
        where: { id: existingScrap.id },
      });
      return NextResponse.json({ scraped: false });
    } else {
      // Add scrap
      await prisma.scrap.create({
        data: {
          userId: session.user.id,
          adId,
        },
      });

      // 찜 마일스톤 감지 — 첫 찜(1) 또는 10단위(10, 20, 30...) 때만 사장에게 알림
      // ACTIVE 광고만 알림 (만료/일시정지 광고는 스킵)
      if (ad.status === "ACTIVE") {
        const scrapCount = await prisma.scrap.count({ where: { adId } });
        const isMilestone =
          scrapCount > ad.lastScrapMilestone &&
          (scrapCount === 1 || scrapCount % 10 === 0);

        if (isMilestone) {
          // 마일스톤 기록 업데이트 (중복 알림 방지)
          await prisma.ad.update({
            where: { id: adId },
            data: { lastScrapMilestone: scrapCount },
          });

          const isFirstScrap = scrapCount === 1;
          const notifTitle = isFirstScrap
            ? "💝 첫 찜을 받았어요!"
            : `🔥 ${scrapCount}명이 찜했어요!`;
          const notifMessage = isFirstScrap
            ? `"${ad.title}" 광고에 첫 찜이 달렸습니다. 관심있는 구직자가 생겼어요!`
            : `"${ad.title}" 광고를 찜한 구직자가 ${scrapCount}명이 되었습니다.`;

          await prisma.notification.create({
            data: {
              userId: ad.userId,
              title: notifTitle,
              message: notifMessage,
              link: "/business/dashboard",
            },
          });

          // 웹 푸시 (비구독자는 자동 스킵)
          sendPushNotification(ad.userId, {
            title: notifTitle,
            body: notifMessage,
            url: "/business/dashboard",
          });
        }
      }

      return NextResponse.json({ scraped: true });
    }
  } catch (error) {
    console.error("Scrap toggle error:", error);
    return NextResponse.json(
      { error: "스크랩 처리 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    if (session.user.role !== "JOBSEEKER") {
      return NextResponse.json(
        { error: "구직자만 스크랩을 조회할 수 있습니다" },
        { status: 403 }
      );
    }

    const scraps = await prisma.scrap.findMany({
      where: { userId: session.user.id },
      include: {
        ad: {
          select: {
            id: true,
            title: true,
            businessName: true,
            salaryText: true,
            regions: true,
            businessType: true,
            createdAt: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(scraps);
  } catch (error) {
    console.error("Scrap list error:", error);
    return NextResponse.json(
      { error: "스크랩 목록 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
