import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { AdBoxCard } from "@/components/ads/AdBoxCard";
import { TierCard } from "@/components/ads/TierCard";
import { BannerSlider } from "@/components/ads/BannerSlider";
import { AdTierPreview } from "@/components/ads/AdTierPreview";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { FloatingChatButton } from "@/components/layout/FloatingChatButton";
import { REGIONS } from "@/lib/constants/regions";
import { BUSINESS_TYPES } from "@/lib/constants/business-types";

export const revalidate = 60;

export const metadata = {
  title: "여시잡 | 유흥알바 밤알바 룸알바 No.1 구인구직",
  description: "여시잡에서 유흥업소 채용정보와 인재를 만나보세요. 룸싸롱, 노래방, 텐카페, 바, 클럽 등 전국 유흥알바 구인구직 플랫폼",
  openGraph: {
    title: "여시잡 | 유흥알바 밤알바 룸알바 No.1 구인구직",
    description: "여시잡에서 유흥업소 채용정보와 인재를 만나보세요. 전국 유흥알바 구인구직 플랫폼",
  },
  alternates: {
    canonical: "/",
  },
};

interface PageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const limit = 20;

  const baseWhere = { status: "ACTIVE" as const };

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
    description: true,
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
    freeAds,
    total,
    totalResumes,
    recentPosts,
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
      take: 6,
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
    prisma.ad.findMany({
      where: { ...baseWhere, productId: "FREE" },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: adSelect,
    }),
    prisma.ad.count({ where: { ...baseWhere, productId: "LINE" } }),
    prisma.resume.count({ where: { isPublic: true } }),
    prisma.post.findMany({
      where: { isHidden: false },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        category: true,
        viewCount: true,
        createdAt: true,
        author: { select: { name: true } },
        _count: { select: { comments: true } },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="mx-auto max-w-screen-xl">
      {/* Announcement Bar */}
      <AnnouncementBar />

      {/* Hero Section with Bokeh Effect */}
      <section className="hero-mesh relative overflow-hidden px-4 pb-12 pt-16 text-center md:py-24">
        <div className="relative z-10">
          <h1 className="text-gradient-gold text-3xl font-bold md:text-5xl lg:text-6xl font-[family-name:var(--font-heading)]">
            밤에 빛나는 여시들의 일자리, 여시잡
          </h1>
          <p className="mt-4 text-lg md:text-xl" style={{ color: "#B0B0B0" }}>
            가장 어울리는 곳에서 당신이 더 빛날 수 있게
          </p>

          {/* Search Bar */}
          <form
            action="/jobs"
            method="get"
            className="hero-search mx-auto mt-8 flex max-w-3xl flex-col overflow-hidden bg-card sm:flex-row"
          >
            <select
              name="region"
              defaultValue=""
              className="h-12 border-b border-border/50 bg-transparent px-4 text-sm text-foreground sm:border-b-0 sm:border-r"
            >
              <option value="">지역 전체</option>
              {Object.entries(REGIONS).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
            <select
              name="businessType"
              defaultValue=""
              className="h-12 border-b border-border/50 bg-transparent px-4 text-sm text-foreground sm:border-b-0 sm:border-r"
            >
              <option value="">업종 전체</option>
              {Object.entries(BUSINESS_TYPES).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
            <input
              type="text"
              name="search"
              placeholder="업소명 / 제목 검색"
              className="h-12 min-w-0 flex-1 bg-transparent px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none sm:border-r sm:border-border/50"
            />
            <button
              type="submit"
              className="mt-2 h-12 rounded-lg bg-primary px-8 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:mt-0 sm:rounded-none"
            >
              검색
            </button>
          </form>
        </div>
      </section>
      <div className="hero-divider" />

      {/* Banner Slider - Premium Full Width */}
      {bannerAds.length > 0 && (
        <section className="border-b bg-gradient-to-r from-background via-primary/3 to-background">
          <BannerSlider ads={bannerAds} />
        </section>
      )}

      {/* VIP Section - 2-Column Grid Cards */}
      {vipAds.length > 0 && (
        <section className="border-b bg-gradient-to-r from-primary/5 to-transparent">
          <div className="px-4 py-4">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
              <span className="rounded bg-gradient-to-r from-primary to-amber px-3 py-1 text-sm text-primary-foreground">
                VIP
              </span>
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {vipAds.map((ad) => (
                <TierCard key={ad.id} ad={ad} tier="VIP" />
              ))}
            </div>
            <div className="px-4 pb-3 pt-2 text-right">
              <Link href="/jobs?productId=VIP" className="text-sm text-primary hover:underline">더보기 →</Link>
            </div>
          </div>
        </section>
      )}

      {/* PREMIUM Section - 2-Column Grid Cards */}
      {premiumAds.length > 0 && (
        <section className="border-b">
          <div className="px-4 py-4">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
              <span className="rounded bg-primary/20 px-3 py-1 text-sm text-primary">
                ⭐ PREMIUM
              </span>
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {premiumAds.map((ad) => (
                <TierCard key={ad.id} ad={ad} tier="PREMIUM" />
              ))}
            </div>
            <div className="px-4 pb-3 pt-2 text-right">
              <Link href="/jobs?productId=PREMIUM" className="text-sm text-primary hover:underline">더보기 →</Link>
            </div>
          </div>
        </section>
      )}

      {/* SPECIAL Section - 3-Column Grid Cards */}
      {specialAds.length > 0 && (
        <section className="border-b">
          <div className="px-4 py-4">
            <h2 className="mb-3 flex items-center gap-2 text-xl font-bold">
              <span className="rounded bg-special/20 px-3 py-1 text-sm text-special">
                스페셜
              </span>
            </h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {specialAds.map((ad) => (
                <TierCard key={ad.id} ad={ad} tier="SPECIAL" />
              ))}
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
                <Link href="/jobs?productId=URGENT" className="mt-2 block text-right text-sm text-urgent hover:underline">더보기 →</Link>
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
                <Link href="/jobs?productId=RECOMMEND" className="mt-2 block text-right text-sm text-primary hover:underline">더보기 →</Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Community Preview */}
      {recentPosts.length > 0 && (
        <section className="border-b px-4 py-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">커뮤니티</h2>
            <div className="flex items-center gap-2">
              <Link href="/community/new">
                <Button size="sm" variant="outline">글쓰기</Button>
              </Link>
              <Link href="/community" className="text-sm text-primary hover:underline">
                더보기 →
              </Link>
            </div>
          </div>
          <div className="divide-y divide-border rounded-lg border">
            {recentPosts.map((post) => (
              <Link key={post.id} href={`/community/${post.id}`} className="block transition-colors hover:bg-muted/50">
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                      post.category === "REVIEW" ? "bg-amber-500/15 text-amber-600 dark:text-amber-400" :
                      post.category === "QUESTION" ? "bg-blue-500/15 text-blue-600 dark:text-blue-400" :
                      post.category === "INFO" ? "bg-green-500/15 text-green-600 dark:text-green-400" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {post.category === "FREE_TALK" ? "자유" : post.category === "REVIEW" ? "후기" : post.category === "QUESTION" ? "질문" : "정보"}
                    </span>
                    <span className="truncate text-sm font-medium">{post.title}</span>
                    {post._count.comments > 0 && (
                      <span className="shrink-0 text-xs text-primary">[{post._count.comments}]</span>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                    <span>{post.author.name}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* LINE Section - Compact List */}
      <section className="border-b">
        <div className="px-4 py-3">
          <h2 className="border-l-4 border-primary pl-3 text-xl font-bold">
            줄광고{" "}
            <span className="font-normal text-muted-foreground">
              {total.toLocaleString()}건
            </span>
          </h2>
        </div>

        {lineAds.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            <p className="text-lg">등록된 채용정보가 없습니다</p>
            <p className="mt-1 text-sm">첫 광고를 등록해보세요!</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {lineAds.map((ad) => {
              const regionLabels = ad.regions.map((r) => REGIONS[r]?.shortLabel || r).join(", ");
              const bizLabel = BUSINESS_TYPES[ad.businessType]?.shortLabel || ad.businessType;
              return (
                <Link key={ad.id} href={`/jobs/${ad.id}`} className="block transition-colors hover:bg-muted/50">
                  {/* Mobile: 2-line card */}
                  <div className="px-4 py-3 text-sm md:hidden">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium">{ad.businessName}</span>
                      <span className="shrink-0 font-medium text-success">{ad.salaryText}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="shrink-0">{regionLabels}</span>
                      <span>·</span>
                      <span className="shrink-0">{bizLabel}</span>
                      <span>·</span>
                      <span className="min-w-0 truncate">{ad.title}</span>
                    </div>
                  </div>
                  {/* Desktop: horizontal row */}
                  <div className="hidden items-center gap-3 px-4 py-3 text-sm md:flex">
                    <span className="w-32 truncate font-medium">{ad.businessName}</span>
                    <span className="text-muted-foreground">|</span>
                    <span className="w-20 shrink-0 text-xs text-muted-foreground">{regionLabels}</span>
                    <span className="text-muted-foreground">|</span>
                    <span className="w-20 shrink-0 text-xs text-muted-foreground">{bizLabel}</span>
                    <span className="text-muted-foreground">|</span>
                    <span className="min-w-0 flex-1 truncate">{ad.title}</span>
                    <span className="text-muted-foreground">|</span>
                    <span className="w-24 shrink-0 text-right font-medium text-success">
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

                return (
                  <span key={p}>
                    {showEllipsis && (
                      <span className="px-2 text-muted-foreground">...</span>
                    )}
                    <a
                      href={`/?page=${p}`}
                      className={`inline-flex h-11 w-11 items-center justify-center rounded text-sm ${
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

      {/* FREE Section - Basic Text List */}
      {freeAds.length > 0 && (
        <section className="border-b">
          <div className="px-4 py-3">
            <h2 className="border-l-4 border-muted-foreground/30 pl-3 text-lg font-bold text-muted-foreground">
              무료 채용정보
            </h2>
          </div>
          <div className="divide-y divide-border">
            {freeAds.map((ad) => {
              const regionLabels = ad.regions.map((r) => REGIONS[r]?.shortLabel || r).join(", ");
              const bizLabel = BUSINESS_TYPES[ad.businessType]?.shortLabel || ad.businessType;
              return (
                <Link key={ad.id} href={`/jobs/${ad.id}`} className="block transition-colors hover:bg-muted/50">
                  {/* Mobile: 2-line card */}
                  <div className="px-4 py-2.5 text-sm text-muted-foreground md:hidden">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate">{ad.businessName}</span>
                      <span className="shrink-0 text-xs">{ad.salaryText}</span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs">
                      <span className="shrink-0">{regionLabels}</span>
                      <span>·</span>
                      <span className="min-w-0 truncate text-foreground">{ad.title}</span>
                    </div>
                  </div>
                  {/* Desktop: horizontal row */}
                  <div className="hidden items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground md:flex">
                    <span className="w-28 truncate">{ad.businessName}</span>
                    <span>|</span>
                    <span className="w-16 shrink-0 text-xs">{regionLabels}</span>
                    <span>|</span>
                    <span className="min-w-0 flex-1 truncate text-foreground">{ad.title}</span>
                    <span className="w-20 shrink-0 text-right text-xs">{ad.salaryText}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Resume Info Section - Simple */}
      {totalResumes > 0 && (
        <section className="border-b bg-section-warm px-4 py-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">
              인재정보 <span className="text-primary">{totalResumes.toLocaleString()}</span>건
            </h2>
            <Link href="/business/resumes">
              <Button variant="outline" size="sm">인재정보 보기</Button>
            </Link>
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
          여시잡에서 최고의 인재를 만나보세요
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
