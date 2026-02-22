import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdCard } from "@/components/ads/AdCard";
import { AdBoxCard } from "@/components/ads/AdBoxCard";
import { BannerSlider } from "@/components/ads/BannerSlider";
import { RegionFilter } from "@/components/ads/RegionFilter";
import { BusinessTypeFilter } from "@/components/ads/BusinessTypeFilter";
import { REGIONS } from "@/lib/constants/regions";
import { BUSINESS_TYPES } from "@/lib/constants/business-types";
import type { Region, BusinessType } from "@/generated/prisma/client";

interface PageProps {
  searchParams: Promise<{
    region?: string;
    businessType?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const region = params.region as Region | undefined;
  const businessType = params.businessType as BusinessType | undefined;
  const search = params.search;
  const page = parseInt(params.page || "1", 10);
  const limit = 20;

  const baseWhere: Record<string, unknown> = { status: "ACTIVE" };
  if (region) baseWhere.regions = { has: region };
  if (businessType) baseWhere.businessType = businessType;
  if (search) {
    baseWhere.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { businessName: { contains: search, mode: "insensitive" } },
    ];
  }

  const adSelect = {
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
    options: {
      select: { optionId: true, value: true },
    },
  };

  const [bannerAds, vipAds, premiumAds, specialAds, urgentAds, recommendAds, lineAds, total] = await Promise.all([
    prisma.ad.findMany({
      where: { ...baseWhere, productId: "BANNER" },
      orderBy: { lastJumpedAt: "desc" },
      take: 12,
      select: adSelect,
    }),
    prisma.ad.findMany({
      where: { ...baseWhere, productId: "VIP" },
      orderBy: { lastJumpedAt: "desc" },
      take: 4,
      select: adSelect,
    }),
    prisma.ad.findMany({
      where: { ...baseWhere, productId: "PREMIUM" },
      orderBy: { lastJumpedAt: "desc" },
      take: 4,
      select: adSelect,
    }),
    prisma.ad.findMany({
      where: { ...baseWhere, productId: "SPECIAL" },
      orderBy: { lastJumpedAt: "desc" },
      take: 5,
      select: adSelect,
    }),
    prisma.ad.findMany({
      where: { ...baseWhere, productId: "URGENT" },
      orderBy: { lastJumpedAt: "desc" },
      take: 5,
      select: adSelect,
    }),
    prisma.ad.findMany({
      where: { ...baseWhere, productId: "RECOMMEND" },
      orderBy: { lastJumpedAt: "desc" },
      take: 6,
      select: adSelect,
    }),
    prisma.ad.findMany({
      where: { ...baseWhere, productId: "LINE" },
      orderBy: { lastJumpedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: adSelect,
    }),
    prisma.ad.count({ where: { ...baseWhere, productId: "LINE" } }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="mx-auto max-w-screen-xl">
      {/* 배너 슬라이더 */}
      <BannerSlider ads={bannerAds} />

      {/* 필터 영역 */}
      <div className="sticky top-14 z-40 border-b bg-background px-4 py-3">
        <div className="flex items-center gap-2">
          <RegionFilter current={region} />
          <BusinessTypeFilter current={businessType} />
        </div>
        <form className="mt-2 flex items-center gap-2" action="/">
          {region && <input type="hidden" name="region" value={region} />}
          {businessType && (
            <input type="hidden" name="businessType" value={businessType} />
          )}
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="업소명, 제목 검색"
            className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            className="h-10 shrink-0 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            검색
          </button>
        </form>
      </div>

      {/* VIP 섹션 */}
      {vipAds.length > 0 && (
        <section className="border-b">
          <div className="flex items-center justify-between px-4 py-2">
            <h2 className="text-sm font-bold">★ 우대 채용정보</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto px-4 pb-3 sm:grid sm:grid-cols-4 sm:overflow-visible">
            {vipAds.map((ad) => (
              <AdBoxCard key={ad.id} ad={ad} />
            ))}
          </div>
        </section>
      )}

      {/* PREMIUM 섹션 */}
      {premiumAds.length > 0 && (
        <section className="border-b">
          <div className="flex items-center justify-between px-4 py-2">
            <h2 className="text-sm font-bold">★ 프리미엄 채용정보</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto px-4 pb-3 sm:grid sm:grid-cols-4 sm:overflow-visible">
            {premiumAds.map((ad) => (
              <AdBoxCard key={ad.id} ad={ad} />
            ))}
          </div>
        </section>
      )}

      {/* SPECIAL 섹션 */}
      {specialAds.length > 0 && (
        <section className="border-b">
          <div className="flex items-center justify-between px-4 py-2">
            <h2 className="text-sm font-bold">★ 스페셜 채용정보</h2>
          </div>
          <div>
            {specialAds.map((ad) => (
              <AdCard key={ad.id} ad={ad} emphasized />
            ))}
          </div>
        </section>
      )}

      {/* URGENT + RECOMMEND 섹션 */}
      {(urgentAds.length > 0 || recommendAds.length > 0) && (
        <section className="border-b">
          <div className="grid gap-4 p-4 sm:grid-cols-2">
            {urgentAds.length > 0 && (
              <div>
                <h2 className="mb-2 text-sm font-bold">★ 급구 채용정보</h2>
                <div className="space-y-1 rounded-lg bg-orange-50 p-3">
                  {urgentAds.map((ad) => (
                    <Link
                      key={ad.id}
                      href={`/jobs/${ad.id}`}
                      className="block rounded p-2 text-sm transition-colors hover:bg-orange-100"
                    >
                      <span className="font-medium">{ad.title}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {ad.regions
                          .map((r) => REGIONS[r]?.shortLabel || r)
                          .join(", ")}{" "}
                        ·{" "}
                        {BUSINESS_TYPES[ad.businessType]?.shortLabel ||
                          ad.businessType}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {recommendAds.length > 0 && (
              <div>
                <h2 className="mb-2 text-sm font-bold">★ 추천 채용정보</h2>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {recommendAds.map((ad) => (
                    <AdBoxCard key={ad.id} ad={ad} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* LINE 섹션 (전체 채용정보) */}
      <section>
        <div className="flex items-center justify-between border-b px-4 py-2">
          <h2 className="text-sm font-semibold">
            전체 채용정보{" "}
            <span className="font-normal text-muted-foreground">
              {total.toLocaleString()}건
            </span>
          </h2>
        </div>

        {lineAds.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            <p className="text-lg">등록된 채용정보가 없습니다</p>
            <p className="mt-1 text-sm">
              {search
                ? "다른 검색어로 시도해보세요"
                : "첫 광고를 등록해보세요!"}
            </p>
          </div>
        ) : (
          <div>
            {lineAds.map((ad) => (
              <AdCard key={ad.id} ad={ad} />
            ))}
          </div>
        )}

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 py-6">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 ||
                  p === totalPages ||
                  (p >= page - 2 && p <= page + 2)
              )
              .map((p, idx, arr) => {
                const prev = arr[idx - 1];
                const showEllipsis = prev !== undefined && p - prev > 1;
                const params = new URLSearchParams();
                if (region) params.set("region", region);
                if (businessType) params.set("businessType", businessType);
                if (search) params.set("search", search);
                params.set("page", String(p));

                return (
                  <span key={p}>
                    {showEllipsis && (
                      <span className="px-2 text-muted-foreground">...</span>
                    )}
                    <a
                      href={`/?${params.toString()}`}
                      className={`inline-flex h-10 w-10 items-center justify-center rounded text-sm ${
                        p === page
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                    >
                      {p}
                    </a>
                  </span>
                );
              })}
          </div>
        )}
      </section>
    </div>
  );
}
