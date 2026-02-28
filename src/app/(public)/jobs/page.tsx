import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdCard } from "@/components/ads/AdCard";
import { REGIONS } from "@/lib/constants/regions";
import { BUSINESS_TYPES } from "@/lib/constants/business-types";
import type { Region, BusinessType } from "@/generated/prisma/client";

export const revalidate = 60;

export const metadata = {
  title: "채용정보",
  description: "전국 유흥업소 채용정보를 확인하세요. 룸싸롱, 노래방, 텐카페, 바, 클럽 등",
  openGraph: {
    title: "채용정보 | 여시잡",
    description: "전국 유흥업소 채용정보를 확인하세요.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "여시잡 - 유흥알바 No.1 구인구직" }],
  },
  alternates: {
    canonical: "/jobs",
  },
};

interface PageProps {
  searchParams: Promise<{
    region?: string;
    businessType?: string;
    productId?: string;
    search?: string;
    page?: string;
    sort?: string;
  }>;
}

export default async function JobsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const region = params.region as Region | undefined;
  const businessType = params.businessType as BusinessType | undefined;
  const productId = params.productId;
  const search = params.search;
  const sort = params.sort || "jump";
  const page = parseInt(params.page || "1", 10);
  const limit = 30;

  const where: Record<string, unknown> = { status: "ACTIVE" };
  if (region) where.regions = { has: region };
  if (businessType) where.businessType = businessType;
  if (productId) where.productId = productId;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { businessName: { contains: search, mode: "insensitive" } },
    ];
  }

  const [ads, total] = await Promise.all([
    prisma.ad.findMany({
      where,
      orderBy: sort === "views" ? { viewCount: "desc" } : { lastJumpedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        title: true,
        businessName: true,
        businessType: true,
        regions: true,
        salaryText: true,
        isVerified: true,
        viewCount: true,
        lastJumpedAt: true,
        productId: true,
        bannerColor: true,
        bannerTitle: true,
        bannerSubtitle: true,
        bannerTemplate: true,
        endDate: true,
        options: { select: { optionId: true, value: true } },
        user: { select: { totalPaidAdDays: true } },
      },
    }),
    prisma.ad.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  // Build pagination URL helper
  function buildUrl(p: number) {
    const params = new URLSearchParams();
    if (region) params.set("region", region);
    if (businessType) params.set("businessType", businessType);
    if (productId) params.set("productId", productId);
    if (search) params.set("search", search);
    if (sort && sort !== "jump") params.set("sort", sort);
    params.set("page", String(p));
    return `/jobs?${params.toString()}`;
  }

  // Title based on filter
  let pageTitle = "전체 채용정보";
  if (productId) {
    const tierNames: Record<string, string> = {
      VIP: "VIP", PREMIUM: "프리미엄", SPECIAL: "스페셜",
      URGENT: "급구", RECOMMEND: "추천", LINE: "일반",
    };
    pageTitle = `${tierNames[productId] || productId} 채용정보`;
  }

  return (
    <div className="mx-auto max-w-screen-xl">
      <div className="border-b px-4 py-6">
        <h1 className="text-2xl font-bold">{pageTitle}</h1>
        <p className="mt-1 text-sm text-muted-foreground">총 {total.toLocaleString()}건</p>
      </div>

      {/* Filters */}
      <div className="sticky top-14 z-40 border-b bg-background px-4 py-3">
        <form action="/jobs" method="get" className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
          <select name="region" defaultValue={region || ""} className="h-10 rounded-md border bg-background px-3 text-sm">
            <option value="">지역 전체</option>
            {Object.entries(REGIONS).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
          <select name="businessType" defaultValue={businessType || ""} className="h-10 rounded-md border bg-background px-3 text-sm">
            <option value="">업종 전체</option>
            {Object.entries(BUSINESS_TYPES).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
          {productId && <input type="hidden" name="productId" value={productId} />}
          <input type="text" name="search" defaultValue={search} placeholder="업소명 / 제목 검색" className="h-10 min-w-0 flex-1 rounded-md border bg-background px-3 text-sm placeholder:text-muted-foreground" />
          <select name="sort" defaultValue={sort} className="h-10 rounded-md border bg-background px-3 text-sm">
            <option value="jump">기본순</option>
            <option value="views">조회순</option>
          </select>
          <button type="submit" className="h-10 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90">검색</button>
        </form>
      </div>

      {/* Ad list */}
      {ads.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          <p className="text-lg">검색 결과가 없습니다</p>
          <p className="mt-1 text-sm">다른 조건으로 검색해보세요</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {ads.map((ad) => (
            <AdCard key={ad.id} ad={ad} productId={ad.productId} />
          ))}
        </div>
      )}

      {/* Pagination - page numbers */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 py-6">
          {page > 1 && (
            <Link href={buildUrl(page - 1)} scroll={false} className="inline-flex h-10 w-10 items-center justify-center rounded text-sm hover:bg-muted">
              ←
            </Link>
          )}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || (p >= page - 2 && p <= page + 2))
            .map((p, idx, arr) => {
              const prev = arr[idx - 1];
              const showEllipsis = prev !== undefined && p - prev > 1;
              return (
                <span key={p}>
                  {showEllipsis && <span className="px-2 text-muted-foreground">...</span>}
                  <Link
                    href={buildUrl(p)}
                    scroll={false}
                    className={`inline-flex h-10 w-10 items-center justify-center rounded text-sm ${
                      p === page ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    }`}
                  >
                    {p}
                  </Link>
                </span>
              );
            })}
          {page < totalPages && (
            <Link href={buildUrl(page + 1)} scroll={false} className="inline-flex h-10 w-10 items-center justify-center rounded text-sm hover:bg-muted">
              →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
