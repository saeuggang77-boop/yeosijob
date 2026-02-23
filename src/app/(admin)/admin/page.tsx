import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AD_PRODUCTS } from "@/lib/constants/products";
import Link from "next/link";

const STATUS_LABELS: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  PENDING: { label: "입금대기", variant: "secondary" },
  APPROVED: { label: "승인", variant: "default" },
  FAILED: { label: "실패", variant: "destructive" },
  CANCELLED: { label: "취소", variant: "destructive" },
  REFUNDED: { label: "환불", variant: "outline" },
};

export default async function AdminDashboardPage() {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);

  // Section 1: Revenue Summary
  const [thisMonthRevenue, lastMonthRevenue, todayRevenue, totalRevenue] =
    await Promise.all([
      prisma.payment.aggregate({
        where: { status: "APPROVED", paidAt: { gte: thisMonthStart } },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          status: "APPROVED",
          paidAt: { gte: lastMonthStart, lt: thisMonthStart },
        },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { status: "APPROVED", paidAt: { gte: todayStart } },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { status: "APPROVED" },
        _sum: { amount: true },
      }),
    ]);

  const thisMonth = thisMonthRevenue._sum.amount || 0;
  const lastMonth = lastMonthRevenue._sum.amount || 0;
  const monthChange =
    lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

  // Section 2: Existing operational stats
  const [
    totalAds,
    activeAds,
    pendingDeposit,
    pendingPayments,
    totalUsers,
    businessUsers,
  ] = await Promise.all([
    prisma.ad.count(),
    prisma.ad.count({ where: { status: "ACTIVE" } }),
    prisma.ad.count({ where: { status: "PENDING_DEPOSIT" } }),
    prisma.payment.count({ where: { status: "PENDING" } }),
    prisma.user.count(),
    prisma.user.count({ where: { role: "BUSINESS" } }),
  ]);

  // Section 3: Ads by product
  const adsByProduct = await prisma.ad.groupBy({
    by: ["productId"],
    where: { status: "ACTIVE" },
    _count: true,
  });

  const productStats = Object.entries(AD_PRODUCTS)
    .map(([id, product]) => ({
      id,
      name: product.name,
      count:
        adsByProduct.find((item) => item.productId === id)?._count || 0,
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);

  // Section 4: New user registrations
  const [
    todayJobseekers,
    todayBusiness,
    weekJobseekers,
    weekBusiness,
    monthJobseekers,
    monthBusiness,
  ] = await Promise.all([
    prisma.user.count({
      where: { role: "JOBSEEKER", createdAt: { gte: todayStart } },
    }),
    prisma.user.count({
      where: { role: "BUSINESS", createdAt: { gte: todayStart } },
    }),
    prisma.user.count({
      where: { role: "JOBSEEKER", createdAt: { gte: weekStart } },
    }),
    prisma.user.count({
      where: { role: "BUSINESS", createdAt: { gte: weekStart } },
    }),
    prisma.user.count({
      where: { role: "JOBSEEKER", createdAt: { gte: thisMonthStart } },
    }),
    prisma.user.count({
      where: { role: "BUSINESS", createdAt: { gte: thisMonthStart } },
    }),
  ]);

  // Section 5: Recent payments
  const recentPayments = await prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      ad: { select: { title: true } },
    },
  });

  const stats = [
    { label: "전체 광고", value: totalAds, href: "/admin/ads" },
    { label: "게재중", value: activeAds, href: "/admin/ads?status=ACTIVE" },
    {
      label: "입금 대기",
      value: pendingDeposit,
      href: "/admin/ads?status=PENDING_DEPOSIT",
      highlight: pendingDeposit > 0,
    },
    {
      label: "미처리 결제",
      value: pendingPayments,
      href: "/admin/payments",
      highlight: pendingPayments > 0,
    },
    { label: "전체 회원", value: totalUsers },
    { label: "사장님 회원", value: businessUsers },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">관리자 대시보드</h1>

      {/* Section 1: Revenue Summary */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">매출 현황</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                오늘 매출
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {(todayRevenue._sum.amount || 0).toLocaleString()}원
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                이번 달 매출
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {thisMonth.toLocaleString()}원
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                지난 달 매출
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {lastMonth.toLocaleString()}원
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                전월 대비
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={`text-3xl font-bold ${
                  monthChange >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {monthChange >= 0 ? "▲" : "▼"} {Math.abs(monthChange).toFixed(1)}
                %
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator />

      {/* Section 2: Operational Stats */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">운영 현황</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((s, i) => (
            <Card
              key={s.label}
              className={`animate-fade-in-up stagger-${i + 1} ${
                s.highlight ? "border-primary bg-primary/5" : ""
              }`}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  {s.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {s.href ? (
                  <Link href={s.href}>
                    <p
                      className={`text-4xl font-bold ${
                        s.highlight ? "text-primary" : ""
                      }`}
                    >
                      {s.value}건
                    </p>
                  </Link>
                ) : (
                  <p className="text-4xl font-bold">{s.value}명</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* Section 3: Ads by Product */}
      {productStats.length > 0 && (
        <>
          <section>
            <h2 className="mb-4 text-lg font-semibold">상품별 광고 현황</h2>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {productStats.map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.name}</span>
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full bg-primary"
                            style={{
                              width: `${
                                (item.count /
                                  Math.max(...productStats.map((p) => p.count))) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                        <span className="w-12 text-right text-sm font-bold">
                          {item.count}건
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          <Separator />
        </>
      )}

      {/* Section 4: New User Registrations */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">신규 가입 현황</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="pb-2 text-left text-sm font-medium text-muted-foreground">
                      기간
                    </th>
                    <th className="pb-2 text-right text-sm font-medium text-muted-foreground">
                      구직자
                    </th>
                    <th className="pb-2 text-right text-sm font-medium text-muted-foreground">
                      업소
                    </th>
                    <th className="pb-2 text-right text-sm font-medium text-muted-foreground">
                      합계
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-3 text-sm">오늘</td>
                    <td className="py-3 text-right text-sm font-medium">
                      {todayJobseekers}명
                    </td>
                    <td className="py-3 text-right text-sm font-medium">
                      {todayBusiness}명
                    </td>
                    <td className="py-3 text-right text-sm font-bold">
                      {todayJobseekers + todayBusiness}명
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 text-sm">이번 주</td>
                    <td className="py-3 text-right text-sm font-medium">
                      {weekJobseekers}명
                    </td>
                    <td className="py-3 text-right text-sm font-medium">
                      {weekBusiness}명
                    </td>
                    <td className="py-3 text-right text-sm font-bold">
                      {weekJobseekers + weekBusiness}명
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 text-sm">이번 달</td>
                    <td className="py-3 text-right text-sm font-medium">
                      {monthJobseekers}명
                    </td>
                    <td className="py-3 text-right text-sm font-medium">
                      {monthBusiness}명
                    </td>
                    <td className="py-3 text-right text-sm font-bold">
                      {monthJobseekers + monthBusiness}명
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* Section 5: Recent Payments */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">최근 결제 내역</h2>
          <Link
            href="/admin/payments"
            className="text-sm text-primary hover:underline"
          >
            전체보기 →
          </Link>
        </div>
        <Card>
          <CardContent className="pt-6">
            {recentPayments.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                최근 결제 내역이 없습니다
              </p>
            ) : (
              <div className="space-y-3">
                {recentPayments.map((payment) => {
                  const statusInfo = STATUS_LABELS[payment.status] || {
                    label: payment.status,
                    variant: "outline" as const,
                  };
                  return (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between border-b pb-3 last:border-0"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium">
                            {payment.ad?.title || "삭제된 광고"}
                          </p>
                          <Badge variant={statusInfo.variant} className="text-xs">
                            {statusInfo.label}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {payment.createdAt.toLocaleString("ko-KR")}
                        </p>
                      </div>
                      <p className="ml-4 shrink-0 text-sm font-bold">
                        {payment.amount.toLocaleString()}원
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
