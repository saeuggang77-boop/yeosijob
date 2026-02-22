import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import type { AdStatus } from "@/generated/prisma/client";

const STATUS_LABELS: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  ACTIVE: { label: "게재중", variant: "default" },
  PENDING_DEPOSIT: { label: "입금대기", variant: "secondary" },
  PENDING_REVIEW: { label: "검토중", variant: "secondary" },
  EXPIRED: { label: "만료", variant: "outline" },
  CANCELLED: { label: "취소", variant: "destructive" },
  REJECTED: { label: "반려", variant: "destructive" },
  DRAFT: { label: "임시저장", variant: "outline" },
  PENDING_PAYMENT: { label: "결제대기", variant: "secondary" },
  PAUSED: { label: "일시정지", variant: "outline" },
};

interface PageProps {
  searchParams: Promise<{ status?: string; page?: string }>;
}

export default async function AdminAdsPage({ searchParams }: PageProps) {
  const { status, page: pageStr } = await searchParams;
  const page = parseInt(pageStr || "1", 10);
  const limit = 20;

  const where = status ? { status: status as AdStatus } : {};

  const [ads, total] = await Promise.all([
    prisma.ad.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { email: true, name: true } },
        payments: {
          where: { status: "PENDING" },
          select: { id: true, orderId: true, amount: true },
          take: 1,
        },
      },
    }),
    prisma.ad.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <h1 className="text-2xl font-bold">광고 관리</h1>

      {/* 상태 필터 */}
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/admin/ads">
          <Badge variant={!status ? "default" : "outline"}>전체 ({total})</Badge>
        </Link>
        {Object.entries(STATUS_LABELS).map(([key, info]) => (
          <Link key={key} href={`/admin/ads?status=${key}`}>
            <Badge variant={status === key ? "default" : "outline"}>
              {info.label}
            </Badge>
          </Link>
        ))}
      </div>

      {/* 광고 리스트 */}
      <div className="mt-6 space-y-3">
        {ads.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              해당하는 광고가 없습니다
            </CardContent>
          </Card>
        ) : (
          ads.map((ad) => {
            const statusInfo = STATUS_LABELS[ad.status] || {
              label: ad.status,
              variant: "outline" as const,
            };
            return (
              <Card key={ad.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="truncate font-medium">{ad.title}</span>
                        <Badge variant={statusInfo.variant}>
                          {statusInfo.label}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {ad.productId}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {ad.businessName} · {ad.totalAmount.toLocaleString()}원
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {ad.user?.email} · {ad.createdAt.toLocaleDateString("ko-KR")}
                      </p>
                    </div>
                    {ad.status === "PENDING_DEPOSIT" && ad.payments[0] && (
                      <Link href={`/admin/payments?highlight=${ad.payments[0].id}`} className="shrink-0">
                        <Badge
                          variant="secondary"
                          className="cursor-pointer bg-orange-100 text-orange-700 hover:bg-orange-200"
                        >
                          입금확인
                        </Badge>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/ads?${status ? `status=${status}&` : ""}page=${p}`}
            >
              <Badge variant={p === page ? "default" : "outline"}>{p}</Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
