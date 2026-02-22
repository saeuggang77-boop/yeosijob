"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DailyMetric {
  date: string;
  views: number;
  clicks: number;
}

interface Stats {
  ad: {
    id: string;
    title: string;
    viewCount: number;
    clickCount: number;
  };
  daily: DailyMetric[];
  summary: {
    totalViews: number;
    totalClicks: number;
    avgViews: number;
    avgClicks: number;
  };
}

interface StatsClientProps {
  initialStats: Stats;
  initialPeriod: number;
  adId: string;
}

export function StatsClient({
  initialStats,
  initialPeriod,
  adId,
}: StatsClientProps) {
  const [period, setPeriod] = useState(initialPeriod);
  const router = useRouter();

  const handlePeriodChange = (newPeriod: number) => {
    setPeriod(newPeriod);
    router.push(`/ads/${adId}/stats?period=${newPeriod}`);
  };

  const maxViews = Math.max(...initialStats.daily.map((d) => d.views), 1);

  return (
    <>
      {/* 기간 선택 버튼 */}
      <div className="mb-6 flex gap-2">
        <Button
          variant={period === 7 ? "default" : "outline"}
          onClick={() => handlePeriodChange(7)}
        >
          7일
        </Button>
        <Button
          variant={period === 14 ? "default" : "outline"}
          onClick={() => handlePeriodChange(14)}
        >
          14일
        </Button>
        <Button
          variant={period === 30 ? "default" : "outline"}
          onClick={() => handlePeriodChange(30)}
        >
          30일
        </Button>
      </div>

      {/* 요약 카드 */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              총 조회수 (기간)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {initialStats.summary.totalViews.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              총 클릭수 (기간)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {initialStats.summary.totalClicks.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              일평균 조회수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {initialStats.summary.avgViews.toFixed(1)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              일평균 클릭수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {initialStats.summary.avgClicks.toFixed(1)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 전체 누적 통계 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">전체 누적 통계</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">총 조회수</span>
            <span className="font-semibold">
              {initialStats.ad.viewCount.toLocaleString()}회
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">총 클릭수</span>
            <span className="font-semibold">
              {initialStats.ad.clickCount.toLocaleString()}회
            </span>
          </div>
        </CardContent>
      </Card>

      {/* CSS 바 차트 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">일별 조회수 추이</CardTitle>
        </CardHeader>
        <CardContent>
          {initialStats.daily.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              데이터가 없습니다
            </p>
          ) : (
            <div className="space-y-3">
              {initialStats.daily.map((metric) => (
                <div key={metric.date} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {new Date(metric.date).toLocaleDateString("ko-KR", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span className="font-medium">
                      {metric.views.toLocaleString()}회
                    </span>
                  </div>
                  <div className="h-6 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{
                        width: `${(metric.views / maxViews) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 일별 데이터 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">일별 상세 데이터</CardTitle>
        </CardHeader>
        <CardContent>
          {initialStats.daily.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              데이터가 없습니다
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="pb-2 text-left font-medium text-muted-foreground">
                      날짜
                    </th>
                    <th className="pb-2 text-right font-medium text-muted-foreground">
                      조회수
                    </th>
                    <th className="pb-2 text-right font-medium text-muted-foreground">
                      클릭수
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {initialStats.daily.map((metric) => (
                    <tr key={metric.date} className="border-b last:border-0">
                      <td className="py-2">
                        {new Date(metric.date).toLocaleDateString("ko-KR")}
                      </td>
                      <td className="py-2 text-right">
                        {metric.views.toLocaleString()}
                      </td>
                      <td className="py-2 text-right">
                        {metric.clicks.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
