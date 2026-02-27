import { prisma } from "@/lib/prisma";
import { AdCard } from "@/components/ads/AdCard";
import { DebouncedSearch } from "@/components/ads/DebouncedSearch";
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
  }>;
}

export default async function JobsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const region = params.region as Region | undefined;
  const businessType = params.businessType as BusinessType | undefined;
  const productId = params.productId;
  const search = params.search;
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
      orderBy: { lastJumpedAt: "desc" },
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
        <DebouncedSearch
          defaultValue={search}
          baseUrl="/jobs"
          additionalParams={{
            ...(region && { region }),
            ...(businessType && { businessType }),
            ...(productId && { productId }),
          }}
        />
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
            <a href={buildUrl(page - 1)} className="inline-flex h-10 w-10 items-center justify-center rounded text-sm hover:bg-muted">
              ←
            </a>
          )}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || (p >= page - 2 && p <= page + 2))
            .map((p, idx, arr) => {
              const prev = arr[idx - 1];
              const showEllipsis = prev !== undefined && p - prev > 1;
              return (
                <span key={p}>
                  {showEllipsis && <span className="px-2 text-muted-foreground">...</span>}
                  <a
                    href={buildUrl(p)}
                    className={`inline-flex h-10 w-10 items-center justify-center rounded text-sm ${
                      p === page ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    }`}
                  >
                    {p}
                  </a>
                </span>
              );
            })}
          {page < totalPages && (
            <a href={buildUrl(page + 1)} className="inline-flex h-10 w-10 items-center justify-center rounded text-sm hover:bg-muted">
              →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
