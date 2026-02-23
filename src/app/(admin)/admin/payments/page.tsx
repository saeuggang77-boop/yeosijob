import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PaymentActions } from "@/components/admin/PaymentActions";
import { PaymentFilters } from "@/components/admin/PaymentFilters";
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

interface PageProps {
  searchParams: Promise<{
    status?: string;
    method?: string;
    period?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function AdminPaymentsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { status, method, period, search, page = "1" } = params;
  const currentPage = parseInt(page, 10);
  const itemsPerPage = 20;

  // Build where clause from filters
  const where: any = {};

  if (status && status !== "ALL") {
    where.status = status;
  }

  if (method && method !== "ALL") {
    where.method = method;
  }

  if (period && period !== "ALL") {
    const now = new Date();
    let periodStart: Date | undefined;

    if (period === "today") {
      periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === "week") {
      periodStart = new Date(now);
      periodStart.setDate(now.getDate() - 7);
    } else if (period === "month") {
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    if (periodStart) {
      where.createdAt = { gte: periodStart };
    }
  }

  if (search) {
    where.OR = [
      { orderId: { contains: search, mode: "insensitive" } },
      { ad: { title: { contains: search, mode: "insensitive" } } },
      { ad: { businessName: { contains: search, mode: "insensitive" } } },
    ];
  }

  // Fetch revenue summary stats
  const [totalRevenue, monthRevenue, avgAmount, totalCount, approvedCount] =
    await Promise.all([
      prisma.payment.aggregate({
        where: { status: "APPROVED" },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          status: "APPROVED",
          paidAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { status: "APPROVED" },
        _avg: { amount: true },
      }),
      prisma.payment.count(),
      prisma.payment.count({ where: { status: "APPROVED" } }),
    ]);

  const approvalRate = totalCount > 0 ? (approvedCount / totalCount) * 100 : 0;

  // Fetch payments with pagination
  const [payments, totalPayments] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * itemsPerPage,
      take: itemsPerPage,
      include: {
        user: { select: { email: true, name: true, businessName: true } },
        ad: { select: { id: true, title: true, businessName: true, durationDays: true } },
      },
    }),
    prisma.payment.count({ where }),
  ]);

  const totalPages = Math.ceil(totalPayments / itemsPerPage);
  const pendingCount = payments.filter((p) => p.status === "PENDING").length;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">결제 관리</h1>
        {pendingCount > 0 && (
          <Badge variant="secondary" className="bg-orange-100 text-orange-700">
            입금대기 {pendingCount}건
          </Badge>
        )}
      </div>

      {/* Revenue Summary Cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              총 승인 매출
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {(totalRevenue._sum.amount || 0).toLocaleString()}원
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
              {(monthRevenue._sum.amount || 0).toLocaleString()}원
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              평균 결제 금액
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {Math.round(avgAmount._avg.amount || 0).toLocaleString()}원
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">승인율</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{approvalRate.toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="mt-6">
        <PaymentFilters />
      </div>

      {/* Payment List */}
      <div className="mt-6 space-y-3">
        {payments.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              결제 내역이 없습니다
            </CardContent>
          </Card>
        ) : (
          payments.map((payment) => {
            const statusInfo = STATUS_LABELS[payment.status] || {
              label: payment.status,
              variant: "outline" as const,
            };
            const snapshot = payment.itemSnapshot as {
              product?: { name: string };
              duration?: number;
            } | null;

            return (
              <Card
                key={payment.id}
                className={payment.status === "PENDING" ? "border-orange-300" : ""}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="truncate">{payment.ad?.title || "삭제된 광고"}</span>
                        <Badge variant={statusInfo.variant}>
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <span className="shrink-0 text-lg font-bold">
                        {payment.amount.toLocaleString()}원
                      </span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p className="truncate">
                      주문번호: <span className="font-mono text-xs">{payment.orderId}</span>
                    </p>
                    <p className="truncate">
                      광고주: {payment.ad?.businessName || "-"} ({payment.user?.email})
                    </p>
                    <p>
                      상품: {snapshot?.product?.name || "-"} ({snapshot?.duration || "-"}일)
                    </p>
                    <p>
                      주문일: {payment.createdAt.toLocaleString("ko-KR")}
                      {payment.paidAt &&
                        ` · 승인: ${payment.paidAt.toLocaleString("ko-KR")}`}
                    </p>
                  </div>
                  {payment.status === "PENDING" && (
                    <div className="mt-3">
                      <PaymentActions paymentId={payment.id} />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            전체 {totalPayments.toLocaleString()}건 중 {((currentPage - 1) * itemsPerPage) + 1}-
            {Math.min(currentPage * itemsPerPage, totalPayments)}건
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              asChild={currentPage > 1}
            >
              {currentPage > 1 ? (
                <Link
                  href={`/admin/payments?${new URLSearchParams({
                    ...(status && status !== "ALL" ? { status } : {}),
                    ...(method && method !== "ALL" ? { method } : {}),
                    ...(period && period !== "ALL" ? { period } : {}),
                    ...(search ? { search } : {}),
                    page: (currentPage - 1).toString(),
                  }).toString()}`}
                >
                  이전
                </Link>
              ) : (
                <span>이전</span>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              asChild={currentPage < totalPages}
            >
              {currentPage < totalPages ? (
                <Link
                  href={`/admin/payments?${new URLSearchParams({
                    ...(status && status !== "ALL" ? { status } : {}),
                    ...(method && method !== "ALL" ? { method } : {}),
                    ...(period && period !== "ALL" ? { period } : {}),
                    ...(search ? { search } : {}),
                    page: (currentPage + 1).toString(),
                  }).toString()}`}
                >
                  다음
                </Link>
              ) : (
                <span>다음</span>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
