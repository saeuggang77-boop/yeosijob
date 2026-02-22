import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default async function AdminDashboardPage() {
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
    <div>
      <h1 className="text-2xl font-bold">관리자 대시보드</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
    </div>
  );
}
