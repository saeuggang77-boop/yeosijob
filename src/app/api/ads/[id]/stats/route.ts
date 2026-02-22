import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  if (session.user.role !== "BUSINESS") {
    return NextResponse.json(
      { error: "사장님 계정만 접근 가능합니다" },
      { status: 403 }
    );
  }

  const { id } = await context.params;

  // 광고 확인 및 권한 체크
  const ad = await prisma.ad.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      viewCount: true,
      clickCount: true,
      userId: true,
    },
  });

  if (!ad) {
    return NextResponse.json(
      { error: "광고를 찾을 수 없습니다" },
      { status: 404 }
    );
  }

  if (ad.userId !== session.user.id) {
    return NextResponse.json(
      { error: "본인의 광고만 조회할 수 있습니다" },
      { status: 403 }
    );
  }

  // 기간 파라미터 (7, 14, 30일, 기본 7일)
  const { searchParams } = new URL(req.url);
  const periodStr = searchParams.get("period") || "7";
  const period = parseInt(periodStr, 10);

  if (![7, 14, 30].includes(period)) {
    return NextResponse.json(
      { error: "기간은 7, 14, 30일만 선택 가능합니다" },
      { status: 400 }
    );
  }

  // 기간 계산
  const endDate = new Date();
  endDate.setHours(0, 0, 0, 0);
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - (period - 1));

  // 일별 데이터 조회
  const dailyMetrics = await prisma.adDailyMetric.findMany({
    where: {
      adId: id,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { date: "asc" },
    select: {
      date: true,
      views: true,
      clicks: true,
    },
  });

  // 요약 통계 계산
  const totalViews = dailyMetrics.reduce((sum, m) => sum + m.views, 0);
  const totalClicks = dailyMetrics.reduce((sum, m) => sum + m.clicks, 0);
  const avgViews = dailyMetrics.length > 0 ? totalViews / dailyMetrics.length : 0;
  const avgClicks = dailyMetrics.length > 0 ? totalClicks / dailyMetrics.length : 0;

  return NextResponse.json({
    ad: {
      id: ad.id,
      title: ad.title,
      viewCount: ad.viewCount,
      clickCount: ad.clickCount,
    },
    daily: dailyMetrics.map((m) => ({
      date: m.date.toISOString().split("T")[0],
      views: m.views,
      clicks: m.clicks,
    })),
    summary: {
      totalViews,
      totalClicks,
      avgViews: Math.round(avgViews * 10) / 10,
      avgClicks: Math.round(avgClicks * 10) / 10,
    },
  });
}
