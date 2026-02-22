import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
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

  const session = await auth();
  const isJobseeker = session?.user?.role === "JOBSEEKER";
  const hasResume = isJobseeker
    ? await prisma.resume.findUnique({ where: { userId: session.user.id }, select: { id: true } }).then(r => !!r)
    : false;
  const showResumeCta = !session || (isJobseeker && !hasResume);

  // Resume counts by business type
  const resumeCountsByType = await Promise.all(
    Object.keys(BUSINESS_TYPES).map(async (type) => ({
      type,
      count: await prisma.resume.count({
        where: {
          isPublic: true,
          desiredJobs: { has: type as BusinessType },
        },
      }),
    }))
  );

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

      {/* 히어로 섹션 */}
      <section className="bg-gradient-to-br from-background via-card to-background px-4 py-12 text-center">
        <h1 className="text-gradient-gold text-4xl font-bold md:text-5xl font-[family-name:var(--font-heading)]">
          유흥업계 No.1 구인구직
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          여시알바에서 최고의 일자리를 찾으세요
        </p>
      </section>

      {/* CTA 배너 */}
      {showResumeCta && (
        <div className="border-b bg-primary/5 px-4 py-4">
          <div className="mx-auto flex items-center justify-between">
            <div>
              <p className="font-medium">이력서를 등록하고 채용 기회를 받아보세요</p>
              <p className="mt-0.5 text-sm text-muted-foreground">업소에서 직접 연락이 옵니다</p>
            </div>
            <Link href={session ? "/jobseeker/my-resume" : "/login"}>
              <Button size="sm">{session ? "이력서 등록하기" : "로그인하기"}</Button>
            </Link>
          </div>
        </div>
      )}

      {/* 최신 인재정보 */}
      {resumeCountsByType.some(r => r.count > 0) && (
        <section className="border-b px-4 py-3">
          <h2 className="border-l-4 border-primary pl-3 text-sm font-bold">최신 인재정보</h2>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
            {resumeCountsByType.filter(r => r.count > 0).map(r => (
              <span key={r.type}>
                {BUSINESS_TYPES[r.type as BusinessType].shortLabel}{" "}
                <strong className="text-foreground">{r.count}</strong>건
              </span>
            ))}
          </div>
        </section>
      )}

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
        <section className="border-b bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center justify-between px-4 py-3">
            <h2 className="border-l-4 border-primary pl-3 text-xl font-bold">
              <span className="rounded bg-gradient-to-r from-primary to-amber px-2 py-0.5 text-sm text-primary-foreground">VIP</span>
            </h2>
          </div>
          <div className="flex gap-3 overflow-x-auto px-4 pb-4 sm:grid sm:grid-cols-4 sm:overflow-visible">
            {vipAds.map((ad) => (
              <AdBoxCard key={ad.id} ad={ad} productId="VIP" />
            ))}
          </div>
        </section>
      )}

      {/* PREMIUM 섹션 */}
      {premiumAds.length > 0 && (
        <section className="border-b">
          <div className="flex items-center justify-between px-4 py-3">
            <h2 className="border-l-4 border-primary pl-3 text-xl font-bold">
              <span className="rounded bg-primary/20 px-2 py-0.5 text-sm text-primary">PREMIUM</span>
            </h2>
          </div>
          <div className="flex gap-3 overflow-x-auto px-4 pb-4 sm:grid sm:grid-cols-4 sm:overflow-visible">
            {premiumAds.map((ad) => (
              <AdBoxCard key={ad.id} ad={ad} productId="PREMIUM" />
            ))}
          </div>
        </section>
      )}

      {/* SPECIAL 섹션 */}
      {specialAds.length > 0 && (
        <section className="border-b">
          <div className="flex items-center justify-between px-4 py-3">
            <h2 className="border-l-4 border-primary pl-3 text-xl font-bold">스페셜 채용정보</h2>
          </div>
          <div>
            {specialAds.map((ad) => (
              <AdCard key={ad.id} ad={ad} productId="SPECIAL" />
            ))}
          </div>
        </section>
      )}

      {/* URGENT + RECOMMEND 섹션 */}
      {(urgentAds.length > 0 || recommendAds.length > 0) && (
        <section className="border-b">
          <div className="grid gap-4 p-4 sm:grid-cols-2">
            {urgentAds.length > 0 && (
              <div className="rounded-xl bg-destructive/5 p-4">
                <h2 className="border-l-4 border-primary pl-3 text-xl font-bold">
                  급구 채용정보 <span className="animate-pulse-urgent ml-2 rounded bg-urgent px-1.5 py-0.5 text-xs font-bold text-white">급구</span>
                </h2>
                <div className="mt-3 space-y-1">
                  {urgentAds.map((ad) => (
                    <Link
                      key={ad.id}
                      href={`/jobs/${ad.id}`}
                      className="block rounded p-2 text-sm transition-colors hover:bg-background/50"
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
              <div className="rounded-xl bg-recommend/5 p-4">
                <h2 className="border-l-4 border-primary pl-3 text-xl font-bold">추천 채용정보</h2>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {recommendAds.map((ad) => (
                    <AdBoxCard key={ad.id} ad={ad}  />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* LINE 섹션 (전체 채용정보) */}
      <section>
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="border-l-4 border-primary pl-3 text-xl font-bold">
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
          <div className="divide-y divide-border">
            {lineAds.map((ad) => (
              <AdCard key={ad.id} ad={ad} productId="LINE" />
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

      {/* 하단 CTA 배너 */}
      <section className="mt-12 rounded-2xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 p-8 text-center">
        <h2 className="text-2xl font-bold">지금 광고를 등록하세요</h2>
        <p className="mt-2 text-muted-foreground">여시알바에서 최고의 인재를 만나보세요</p>
        <Link href="/business/ads/new">
          <Button size="lg" className="mt-4">광고 등록하기</Button>
        </Link>
      </section>
    </div>
  );
}
