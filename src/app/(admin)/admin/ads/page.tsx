import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AdStatus } from "@/generated/prisma/client";

interface PageProps {
  searchParams: Promise<{
    status?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function AdminAdsPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const params = await searchParams;
  const status = params.status as AdStatus | undefined;
  const search = params.search;
  const page = parseInt(params.page || "1", 10);
  const limit = 20;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { businessName: { contains: search, mode: "insensitive" } },
    ];
  }

  const [ads, total] = await Promise.all([
    prisma.ad.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        title: true,
        businessName: true,
        businessType: true,
        regions: true,
        productId: true,
        status: true,
        totalAmount: true,
        viewCount: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.ad.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    ACTIVE: { label: "게재중", variant: "default" },
    DRAFT: { label: "작성중", variant: "secondary" },
    PENDING_PAYMENT: { label: "결제대기", variant: "outline" },
    PENDING_DEPOSIT: { label: "입금대기", variant: "outline" },
    PENDING_REVIEW: { label: "검토중", variant: "outline" },
    PAUSED: { label: "일시정지", variant: "secondary" },
    EXPIRED: { label: "만료", variant: "secondary" },
    REJECTED: { label: "반려", variant: "destructive" },
    CANCELLED: { label: "취소", variant: "destructive" },
  };

  const statuses = ["ACTIVE", "PENDING_DEPOSIT", "PENDING_REVIEW", "PAUSED", "EXPIRED", "REJECTED"];

  function buildUrl(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    const s = overrides.status ?? status;
    const q = overrides.search ?? search;
    const pg = overrides.page ?? String(page);
    if (s) p.set("status", s);
    if (q) p.set("search", q);
    if (pg !== "1") p.set("page", pg);
    return `/admin/ads?${p.toString()}`;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">광고 관리</h1>
        <span className="text-sm text-muted-foreground">총 {total}건</span>
      </div>

      {/* Status filter */}
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/admin/ads">
          <Button variant={!status ? "default" : "outline"} size="sm">전체</Button>
        </Link>
        {statuses.map((s) => (
          <Link key={s} href={buildUrl({ status: s, page: "1" })}>
            <Button variant={status === s ? "default" : "outline"} size="sm">
              {statusLabels[s]?.label || s}
            </Button>
          </Link>
        ))}
      </div>

      {/* Search */}
      <form className="mt-4" action="/admin/ads">
        {status && <input type="hidden" name="status" value={status} />}
        <div className="flex gap-2">
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="업소명, 제목으로 검색"
            className="h-10 flex-1 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button type="submit" className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
            검색
          </button>
        </div>
      </form>

      {/* Table */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-3 font-medium">제목</th>
              <th className="pb-3 font-medium">업소명</th>
              <th className="pb-3 font-medium">등급</th>
              <th className="pb-3 font-medium">상태</th>
              <th className="pb-3 font-medium">조회</th>
              <th className="pb-3 font-medium">등록일</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {ads.map((ad) => (
              <tr key={ad.id} className="hover:bg-muted/50">
                <td className="py-3">
                  <Link href={`/admin/ads/${ad.id}`} className="font-medium hover:text-primary">
                    {ad.title}
                  </Link>
                </td>
                <td className="py-3 text-muted-foreground">{ad.businessName}</td>
                <td className="py-3">
                  <Badge variant="outline" className="text-xs">{ad.productId}</Badge>
                </td>
                <td className="py-3">
                  <Badge variant={statusLabels[ad.status]?.variant || "secondary"}>
                    {statusLabels[ad.status]?.label || ad.status}
                  </Badge>
                </td>
                <td className="py-3 text-muted-foreground">{ad.viewCount}</td>
                <td className="py-3 text-muted-foreground">
                  {new Date(ad.createdAt).toLocaleDateString("ko-KR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {ads.length === 0 && (
        <p className="py-12 text-center text-muted-foreground">검색 결과가 없습니다</p>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-1">
          {page > 1 && (
            <a href={buildUrl({ page: String(page - 1) })} className="inline-flex h-10 w-10 items-center justify-center rounded text-sm hover:bg-muted">←</a>
          )}
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
            const p = Math.max(1, Math.min(page - 4, totalPages - 9)) + i;
            if (p > totalPages) return null;
            return (
              <a
                key={p}
                href={buildUrl({ page: String(p) })}
                className={`inline-flex h-10 w-10 items-center justify-center rounded text-sm ${
                  p === page ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                {p}
              </a>
            );
          })}
          {page < totalPages && (
            <a href={buildUrl({ page: String(page + 1) })} className="inline-flex h-10 w-10 items-center justify-center rounded text-sm hover:bg-muted">→</a>
          )}
        </div>
      )}
    </div>
  );
}
