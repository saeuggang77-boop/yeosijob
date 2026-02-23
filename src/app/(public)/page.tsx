import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdCard } from "@/components/ads/AdCard";
import { AdBoxCard } from "@/components/ads/AdBoxCard";
import { BannerSlider } from "@/components/ads/BannerSlider";
import { RegionChips } from "@/components/ads/RegionChips";
import { BusinessTypeChips } from "@/components/ads/BusinessTypeChips";
import { AdTierPreview } from "@/components/ads/AdTierPreview";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { FloatingChatButton } from "@/components/layout/FloatingChatButton";
import { REGIONS } from "@/lib/constants/regions";
import { BUSINESS_TYPES } from "@/lib/constants/business-types";
import type { Region, BusinessType } from "@/generated/prisma/client";

export const revalidate = 60;

interface PageProps {
  searchParams: Promise<{
    region?: string;
    businessType?: string;
    search?: string;
    page?: string;
  }>;
}

const BUSINESS_TYPE_EMOJIS: Record<BusinessType, string> = {
  KARAOKE: "🎤",
  ROOM_SALON: "🥂",
  TEN_CAFE: "☕",
  SHIRT_ROOM: "👔",
  LEGGINGS_ROOM: "👗",
  PUBLIC_BAR: "🍸",
  HYPER_PUBLIC: "🎉",
  BAR_LOUNGE: "🍷",
  CLUB: "🎵",
  MASSAGE: "💆",
  GUANRI: "✨",
  OTHER: "📋",
};

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
    thumbnailUrl: true,
    options: {
      select: { optionId: true, value: true },
    },
  };

  const [
    bannerAds,
    vipAds,
    premiumAds,
    specialAds,
    urgentAds,
    recommendAds,
    lineAds,
    total,
    totalActiveAds,
    totalResumes,
    resumeCountsByType,
  ] = await Promise.all([
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
      take: 3,
      select: adSelect,
    }),
    prisma.ad.findMany({
      where: { ...baseWhere, productId: "RECOMMEND" },
      orderBy: { lastJumpedAt: "desc" },
      take: 3,
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
    prisma.ad.count({ where: { status: "ACTIVE" } }),
    prisma.resume.count({ where: { isPublic: true } }),
    Promise.all(
      Object.keys(BUSINESS_TYPES).map(async (type) => ({
        type: type as BusinessType,
        count: await prisma.resume.count({
          where: {
            isPublic: true,
            desiredJobs: { has: type as BusinessType },
          },
        }),
      }))
    ),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="mx-auto max-w-screen-xl">
      {/* Announcement Bar */}
      <AnnouncementBar />

      {/* Hero Section with Mesh Gradient */}
      <section className="hero-mesh relative overflow-hidden px-4 py-16 text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background/60"></div>
        <div className="relative z-10">
          <h1 className="text-gradient-gold text-4xl font-bold md:text-5xl lg:text-6xl font-[family-name:var(--font-heading)]">
            유흥업계 No.1 구인구직
          </h1>
          <p className="mt-4 text-lg text-[#B0B0B0] md:text-xl">
            여시알바에서 최고의 일자리를 찾으세요
          </p>

          {/* Trust Metrics */}
          <div className="mt-6 flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <span>
              등록업소 <strong className="text-primary">{totalActiveAds.toLocaleString()}</strong>건
            </span>
            <span className="text-border">|</span>
            <span>
              인재정보 <strong className="text-primary">{totalResumes.toLocaleString()}</strong>건
            </span>
          </div>

          {/* Integrated Search Bar */}
          <form className="mx-auto mt-8 max-w-4xl" action="/">
            <div className="flex flex-col gap-2 rounded-lg border bg-card p-2 shadow-lg sm:flex-row sm:items-center">
              <select
                name="region"
                defaultValue={region || ""}
                className="h-10 rounded-md border-0 bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring sm:w-32"
              >
                <option value="">지역 전체</option>
                {Object.entries(REGIONS).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.label}
                  </option>
                ))}
              </select>
              <div className="hidden h-6 w-px bg-border sm:block"></div>
              <select
                name="businessType"
                defaultValue={businessType || ""}
                className="h-10 rounded-md border-0 bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring sm:w-40"
              >
                <option value="">업종 전체</option>
                {Object.entries(BUSINESS_TYPES).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.label}
                  </option>
                ))}
              </select>
              <div className="hidden h-6 w-px bg-border sm:block"></div>
              <input
                type="text"
                name="search"
                defaultValue={search}
                placeholder="업소명, 제목 검색"
                className="h-10 flex-1 rounded-md border-0 bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="submit"
                className="h-10 shrink-0 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                검색
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Region Chips */}
      <section className="border-b bg-muted/30 px-4 py-3">
        <RegionChips current={region} />
      </section>

      {/* Business Type Chips */}
      <section className="border-b bg-muted/30 px-4 py-3">
        <BusinessTypeChips current={businessType} />
      </section>

      {/* Banner Slider - Full Width, Most Prominent */}
      {bannerAds.length > 0 && (
        <section className="border-b">
          <BannerSlider ads={bannerAds} />
        </section>
      )}

      {/* VIP Section - Full-Width Banner Cards */}
      {vipAds.length > 0 && (
        <section className="border-b bg-gradient-to-r from-primary/5 to-transparent">
          <div className="px-4 py-4">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
              <span className="rounded bg-gradient-to-r from-primary to-amber px-3 py-1 text-sm text-primary-foreground">
                VIP
              </span>
            </h2>
            <div className="space-y-3">
              {vipAds.map((ad) => {
                const regionLabels = ad.regions.map((r) => REGIONS[r]?.shortLabel || r).join(", ");
                const bizLabel = BUSINESS_TYPES[ad.businessType]?.shortLabel || ad.businessType;
                return (
                  <Link key={ad.id} href={`/jobs/${ad.id}`} className="block">
                    <div className="flex items-center gap-4 rounded-lg border border-primary bg-gradient-to-r from-primary/10 to-accent/10 p-4 transition-all hover:shadow-lg">
                      {ad.thumbnailUrl && (
                        <img
                          src={ad.thumbnailUrl}
                          alt={ad.title}
                          className="h-16 w-16 shrink-0 rounded-lg object-cover"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="shrink-0 rounded bg-gradient-to-r from-primary to-amber px-2 py-0.5 text-xs font-bold text-primary-foreground">
                            VIP
                          </span>
                          <h3 className="truncate text-base font-bold">{ad.title}</h3>
                          {ad.isVerified && (
                            <Badge variant="secondary" className="shrink-0 text-[10px] px-1 py-0">
                              인증
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{ad.businessName}</span>
                          <span>·</span>
                          <span>{regionLabels}</span>
                          <span>·</span>
                          <span>{bizLabel}</span>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-base font-bold text-success">{ad.salaryText}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          조회 {ad.viewCount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            <div className="px-4 pb-3 pt-2 text-right">
              <Link href="/jobs?productId=VIP" className="text-sm text-primary hover:underline">더보기 →</Link>
            </div>
          </div>
        </section>
      )}

      {/* PREMIUM Section - Full-Width Banner Cards */}
      {premiumAds.length > 0 && (
        <section className="border-b">
          <div className="px-4 py-4">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
              <span className="rounded bg-primary/20 px-3 py-1 text-sm text-primary">
                ⭐ PREMIUM
              </span>
            </h2>
            <div className="space-y-3">
              {premiumAds.map((ad) => {
                const regionLabels = ad.regions.map((r) => REGIONS[r]?.shortLabel || r).join(", ");
                const bizLabel = BUSINESS_TYPES[ad.businessType]?.shortLabel || ad.businessType;
                return (
                  <Link key={ad.id} href={`/jobs/${ad.id}`} className="block">
                    <div className="flex items-center gap-4 rounded-lg border border-primary/50 bg-primary/5 p-4 transition-all hover:shadow-lg">
                      {ad.thumbnailUrl && (
                        <img
                          src={ad.thumbnailUrl}
                          alt={ad.title}
                          className="h-16 w-16 shrink-0 rounded-lg object-cover"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="shrink-0 rounded bg-primary/20 px-2 py-0.5 text-xs font-bold text-primary">
                            PREMIUM
                          </span>
                          <span className="text-sm">⭐</span>
                          <h3 className="truncate text-base font-bold">{ad.title}</h3>
                          {ad.isVerified && (
                            <Badge variant="secondary" className="shrink-0 text-[10px] px-1 py-0">
                              인증
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{ad.businessName}</span>
                          <span>·</span>
                          <span>{regionLabels}</span>
                          <span>·</span>
                          <span>{bizLabel}</span>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-base font-bold text-success">{ad.salaryText}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          조회 {ad.viewCount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            <div className="px-4 pb-3 pt-2 text-right">
              <Link href="/jobs?productId=PREMIUM" className="text-sm text-primary hover:underline">더보기 →</Link>
            </div>
          </div>
        </section>
      )}

      {/* SPECIAL Section - List Style with Purple Border */}
      {specialAds.length > 0 && (
        <section className="border-b">
          <div className="px-4 py-4">
            <h2 className="mb-3 flex items-center gap-2 text-xl font-bold">
              <span className="rounded bg-special/20 px-3 py-1 text-sm text-special">
                스페셜
              </span>
            </h2>
            <div className="space-y-2">
              {specialAds.map((ad) => {
                const regionLabels = ad.regions.map((r) => REGIONS[r]?.shortLabel || r).join(", ");
                const bizLabel = BUSINESS_TYPES[ad.businessType]?.shortLabel || ad.businessType;
                return (
                  <Link key={ad.id} href={`/jobs/${ad.id}`} className="block">
                    <div className="flex items-center gap-3 rounded-lg border-l-4 border-l-special bg-special/5 p-3 transition-colors hover:bg-special/10">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="shrink-0 rounded bg-special/20 px-2 py-0.5 text-xs font-bold text-special">
                            SPECIAL
                          </span>
                          <h3 className="truncate text-sm font-bold">{ad.title}</h3>
                          {ad.isVerified && (
                            <Badge variant="secondary" className="shrink-0 text-[10px] px-1 py-0">
                              인증
                            </Badge>
                          )}
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{ad.businessName}</span>
                          <span>·</span>
                          <span>{regionLabels}</span>
                          <span>·</span>
                          <span>{bizLabel}</span>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-medium text-success">{ad.salaryText}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          조회 {ad.viewCount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            <div className="px-4 pb-3 pt-2 text-right">
              <Link href="/jobs?productId=SPECIAL" className="text-sm text-special hover:underline">더보기 →</Link>
            </div>
          </div>
        </section>
      )}

      {/* URGENT + RECOMMEND Section - 2 Column Grid */}
      {(urgentAds.length > 0 || recommendAds.length > 0) && (
        <section className="border-b">
          <div className="grid gap-4 p-4 md:grid-cols-2">
            {/* Urgent Column */}
            {urgentAds.length > 0 && (
              <div className="rounded-xl bg-urgent/5 p-4">
                <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
                  <span className="animate-pulse-urgent rounded bg-urgent px-2 py-0.5 text-xs font-bold text-white">
                    급구
                  </span>
                  급구 채용정보
                </h2>
                <div className="space-y-2">
                  {urgentAds.map((ad) => (
                    <AdBoxCard key={ad.id} ad={ad} productId="URGENT" />
                  ))}
                </div>
                <Link href="/jobs?productId=URGENT" className="mt-2 block text-sm text-urgent hover:underline">더보기 →</Link>
              </div>
            )}
            {/* Recommend Column */}
            {recommendAds.length > 0 && (
              <div className="rounded-xl bg-recommend/5 p-4">
                <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
                  <span className="rounded bg-recommend/20 px-2 py-0.5 text-xs font-bold text-recommend">
                    추천
                  </span>
                  추천 채용정보
                </h2>
                <div className="space-y-2">
                  {recommendAds.map((ad) => (
                    <AdBoxCard key={ad.id} ad={ad} productId="RECOMMEND" />
                  ))}
                </div>
                <Link href="/jobs?productId=RECOMMEND" className="mt-2 block text-sm text-primary hover:underline">더보기 →</Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* LINE Section - Compact List */}
      <section className="border-b">
        <div className="px-4 py-3">
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
            {lineAds.map((ad) => {
              const regionLabels = ad.regions.map((r) => REGIONS[r]?.shortLabel || r).join(", ");
              const bizLabel = BUSINESS_TYPES[ad.businessType]?.shortLabel || ad.businessType;
              return (
                <Link key={ad.id} href={`/jobs/${ad.id}`} className="block">
                  <div className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-muted/50">
                    <span className="w-32 truncate font-medium">{ad.businessName}</span>
                    <span className="text-muted-foreground">|</span>
                    <span className="w-20 shrink-0 text-xs text-muted-foreground">{regionLabels}</span>
                    <span className="text-muted-foreground">|</span>
                    <span className="w-20 shrink-0 text-xs text-muted-foreground">{bizLabel}</span>
                    <span className="text-muted-foreground">|</span>
                    <span className="min-w-0 flex-1 truncate">{ad.title}</span>
                    <span className="text-muted-foreground">|</span>
                    <span className="w-24 shrink-0 text-right font-medium text-primary">
                      {ad.salaryText}
                    </span>
                    <span className="text-muted-foreground">|</span>
                    <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">
                      조회 {ad.viewCount.toLocaleString()}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Pagination */}
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

      {/* Resume Info Section */}
      {resumeCountsByType.some((r) => r.count > 0) && (
        <section className="border-b bg-section-warm px-4 py-6">
          <h2 className="mb-4 text-xl font-bold">인재정보</h2>
          <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {resumeCountsByType
              .filter((r) => r.count > 0)
              .map((r) => (
                <Link
                  key={r.type}
                  href={`/resumes?businessType=${r.type}`}
                  className="flex flex-col items-center gap-2 rounded-lg border bg-card p-4 transition-all hover:shadow-md"
                >
                  <span className="text-2xl">{BUSINESS_TYPE_EMOJIS[r.type]}</span>
                  <span className="text-xs text-muted-foreground">
                    {BUSINESS_TYPES[r.type].shortLabel}
                  </span>
                  <span className="text-lg font-bold text-primary">
                    {r.count}건
                  </span>
                </Link>
              ))}
          </div>
        </section>
      )}

      {/* Ad Tier Preview Section */}
      <section className="border-b px-4 py-6">
        <h2 className="mb-4 text-xl font-bold">광고 등급별 미리보기</h2>
        <AdTierPreview />
      </section>

      {/* CTA Section - Dark + Gold Gradient */}
      <section className="mt-8 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-8 text-center">
        <h2 className="text-gradient-gold text-2xl font-bold md:text-3xl">
          지금 광고를 등록하세요
        </h2>
        <p className="mt-3 text-muted-foreground">
          여시알바에서 최고의 인재를 만나보세요
        </p>
        <Link href="/business/ads/new">
          <Button
            size="lg"
            className="mt-6 bg-gradient-to-r from-primary to-amber shadow-lg shadow-primary/30 transition-all hover:shadow-xl hover:shadow-primary/40"
          >
            광고 등록하기
          </Button>
        </Link>
      </section>

      {/* Floating Chat Button */}
      <FloatingChatButton />
    </div>
  );
}
