import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatsClient } from "./StatsClient";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ period?: string }>;
}

export default async function AdStatsPage({ params, searchParams }: PageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  if (session.user.role !== "BUSINESS") {
    redirect("/business/dashboard");
  }

  const { id } = await params;
  const { period = "7" } = await searchParams;

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
    redirect("/business/dashboard");
  }

  if (ad.userId !== session.user.id) {
    redirect("/business/dashboard");
  }

  // 기간 파라미터 검증
  const periodNum = parseInt(period, 10);
  const validPeriod = [7, 14, 30].includes(periodNum) ? periodNum : 7;

  // 기간 계산
  const endDate = new Date();
  endDate.setHours(0, 0, 0, 0);
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - (validPeriod - 1));

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
  const avgViews =
    dailyMetrics.length > 0 ? totalViews / dailyMetrics.length : 0;
  const avgClicks =
    dailyMetrics.length > 0 ? totalClicks / dailyMetrics.length : 0;

  const stats = {
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
  };

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            href="/business/dashboard"
            className="text-sm text-muted-foreground hover:underline"
          >
            ← 대시보드로
          </Link>
          <h1 className="mt-2 text-2xl font-bold">광고 통계</h1>
          <p className="mt-1 text-sm text-muted-foreground">{ad.title}</p>
        </div>
      </div>

      <StatsClient initialStats={stats} initialPeriod={validPeriod} adId={id} />
    </div>
  );
}
