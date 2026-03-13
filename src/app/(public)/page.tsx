import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { AdBoxCard } from "@/components/ads/AdBoxCard";
import { TierCard } from "@/components/ads/TierCard";
import { BannerSlider } from "@/components/ads/BannerSlider";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { EventBanner } from "@/components/layout/EventBanner";
import { CommunitySection } from "@/components/community/CommunitySection";
import { REGIONS } from "@/lib/constants/regions";
import { BUSINESS_TYPES } from "@/lib/constants/business-types";
import { EXPERIENCE_LEVELS } from "@/lib/constants/resume";
import { PARTNER_CATEGORIES, PARTNER_GRADES } from "@/lib/constants/partners";
import { getActiveEvent } from "@/lib/event";
import type { PartnerGrade, PartnerCategory, Region } from "@/generated/prisma/client";

function isNewPost(createdAt: Date): boolean {
  return Date.now() - new Date(createdAt).getTime() < 24 * 60 * 60 * 1000;
}

export const revalidate = 60;

export const metadata = {
  title: { absolute: "여시잡 | 유흥알바 밤알바 룸알바 No.1 구인구직" },
  description: "여시잡에서 유흥업소 채용정보와 인재를 만나보세요. 룸싸롱, 노래방, 텐카페, 바, 클럽 등 전국 유흥알바 구인구직 플랫폼",
  openGraph: {
    title: "여시잡 | 유흥알바 밤알바 룸알바 No.1 구인구직",
    description: "여시잡에서 유흥업소 채용정보와 인재를 만나보세요. 전국 유흥알바 구인구직 플랫폼",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "여시잡 - 유흥알바 No.1 구인구직" }],
  },
  alternates: {
    canonical: "/",
  },
};

export default async function HomePage() {
  const event = await getActiveEvent();
  const eventInfo = event ? {
    eventName: event.eventName,
    bonus30: event.bonus30,
    bonus60: event.bonus60,
    bonus90: event.bonus90,
    endDate: event.endDate?.toISOString() || null,
  } : null;

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
    bannerColor: true,
    bannerTitle: true,
    bannerSubtitle: true,
    bannerTemplate: true,
    endDate: true,
    options: {
      select: { optionId: true, value: true },
    },
    user: {
      select: { totalPaidAdDays: true },
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
    , // LINE count (unused)
    recentResumes,
    postsAll,
    postsCHAT,
    postsBEAUTY,
    postsQNA,
    postsWORK,
    hotPost,
    partnerAds,
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
      take: 6,
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
      take: 10,
      select: adSelect,
    }),
    prisma.ad.findMany({
      where: { ...baseWhere, productId: "FREE" },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: adSelect,
    }),
    Promise.resolve(0), // placeholder to keep destructuring index
    prisma.resume.findMany({
      where: { isPublic: true },
      orderBy: [
        { lastBumpedAt: { sort: "desc", nulls: "last" } },
        { updatedAt: "desc" },
      ],
      take: 5,
      select: {
        id: true,
        nickname: true,
        title: true,
        age: true,
        region: true,
        desiredJobs: true,
        experienceLevel: true,
        updatedAt: true,
      },
    }),
    prisma.post.findMany({ where: { isHidden: false, deletedAt: null }, orderBy: { createdAt: "desc" }, take: 5, select: { id: true, slug: true, title: true, content: true, category: true, viewCount: true, createdAt: true, author: { select: { name: true } }, _count: { select: { comments: { where: { deletedAt: null } }, likes: true } } } }),
    prisma.post.findMany({ where: { isHidden: false, deletedAt: null, category: "CHAT" }, orderBy: { createdAt: "desc" }, take: 5, select: { id: true, slug: true, title: true, content: true, category: true, viewCount: true, createdAt: true, author: { select: { name: true } }, _count: { select: { comments: { where: { deletedAt: null } }, likes: true } } } }),
    prisma.post.findMany({ where: { isHidden: false, deletedAt: null, category: "BEAUTY" }, orderBy: { createdAt: "desc" }, take: 5, select: { id: true, slug: true, title: true, content: true, category: true, viewCount: true, createdAt: true, author: { select: { name: true } }, _count: { select: { comments: { where: { deletedAt: null } }, likes: true } } } }),
    prisma.post.findMany({ where: { isHidden: false, deletedAt: null, category: "QNA" }, orderBy: { createdAt: "desc" }, take: 5, select: { id: true, slug: true, title: true, content: true, category: true, viewCount: true, createdAt: true, author: { select: { name: true } }, _count: { select: { comments: { where: { deletedAt: null } }, likes: true } } } }),
    prisma.post.findMany({ where: { isHidden: false, deletedAt: null, category: "WORK" }, orderBy: { createdAt: "desc" }, take: 5, select: { id: true, slug: true, title: true, content: true, category: true, viewCount: true, createdAt: true, author: { select: { name: true } }, _count: { select: { comments: { where: { deletedAt: null } }, likes: true } } } }),
    prisma.post.findFirst({
      where: {
        isHidden: false,
        deletedAt: null,
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      },
      orderBy: [
        { likes: { _count: "desc" } },
        { comments: { _count: "desc" } },
        { viewCount: "desc" },
      ],
      select: {
        id: true,
        slug: true,
        title: true,
        content: true,
        category: true,
        createdAt: true,
        _count: { select: { comments: { where: { deletedAt: null } }, likes: true } },
      },
    }),
    // 제휴업체 (메인 노출: A/B/C 등급만)
    prisma.partner.findMany({
      where: { status: "ACTIVE", grade: { in: ["A", "B", "C"] } },
      select: {
        id: true,
        name: true,
        category: true,
        region: true,
        description: true,
        highlight: true,
        thumbnailUrl: true,
        grade: true,
        tags: true,
        viewCount: true,
      },
    }),
  ]);


  // 제휴업체 같은 등급 내 랜덤 셔플
  const gradeOrder: PartnerGrade[] = ["A", "B", "C"];
  const shuffledPartners = gradeOrder.flatMap((g) => {
    const group = partnerAds.filter((p) => p.grade === g);
    for (let i = group.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [group[i], group[j]] = [group[j], group[i]];
    }
    return group;
  });

  return (
    <div className="mx-auto max-w-screen-xl">
      {/* Announcement Bar */}
      <AnnouncementBar />
      {eventInfo && <EventBanner eventInfo={eventInfo} />}

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
            <div className="flex border-b border-border/50 sm:contents">
              <select
                name="region"
                defaultValue=""
                className="h-9 flex-1 border-r border-border/50 bg-transparent px-3 text-xs text-foreground sm:h-12 sm:flex-none sm:border-b-0 sm:px-4 sm:text-sm"
              >
                <option value="">지역 전체</option>
                {Object.entries(REGIONS).filter(([k]) => k !== "NATIONWIDE").map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
              <select
                name="businessType"
                defaultValue=""
                className="h-9 flex-1 bg-transparent px-3 text-xs text-foreground sm:h-12 sm:flex-none sm:border-b-0 sm:border-r sm:border-border/50 sm:px-4 sm:text-sm"
              >
                <option value="">업종 전체</option>
                {Object.entries(BUSINESS_TYPES).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>
            <div className="flex sm:contents">
              <input
                type="text"
                name="search"
                placeholder="업소명 / 제목 검색"
                className="h-[42px] min-w-0 flex-1 bg-transparent px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none sm:h-12 sm:border-r sm:border-border/50"
              />
              <button
                type="submit"
                className="h-[42px] shrink-0 rounded-br-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:h-12 sm:rounded-none sm:px-8"
              >
                검색
              </button>
            </div>
          </form>
        </div>
      </section>
      <div className="hero-divider" />

      {/* Banner Slider - Premium Full Width */}
      {bannerAds.length > 0 && (
        <section className="border-b bg-gradient-to-r from-background via-primary/3 to-background">
          <div className="px-4 pt-4">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <span className="rounded bg-gradient-to-r from-primary to-amber px-3 py-1 text-sm text-primary-foreground">
                ⭐ 노블레스
              </span>
            </h2>
          </div>
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
                <TierCard key={ad.id} ad={ad} tier="VIP"  />
              ))}
            </div>
            <div className="pb-3 pt-2 text-right">
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
                PREMIUM
              </span>
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {premiumAds.map((ad) => (
                <TierCard key={ad.id} ad={ad} tier="PREMIUM"  />
              ))}
            </div>
            <div className="pb-3 pt-2 text-right">
              <Link href="/jobs?productId=PREMIUM" className="text-sm text-primary hover:underline">더보기 →</Link>
            </div>
          </div>
        </section>
      )}

      {/* PARTNER Section - 2열 카드 (PREMIUM 바로 아래) */}
      {shuffledPartners.length > 0 && (
        <section className="border-b">
          <div className="px-4 py-4">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
              <span className="rounded border border-primary/40 bg-primary/10 px-3 py-1 text-sm text-primary">
                제휴업체
              </span>
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {shuffledPartners.slice(0, 4).map((partner) => {
                const gradeInfo = PARTNER_GRADES[partner.grade];
                const catInfo = PARTNER_CATEGORIES[partner.category];
                const regionLabel = REGIONS[partner.region]?.shortLabel || partner.region;
                const isA = partner.grade === "A";
                const isB = partner.grade === "B";

                return (
                  <Link
                    key={partner.id}
                    href={`/partner/${partner.id}`}
                    className={`flex overflow-hidden rounded-xl border transition-colors hover:border-primary ${
                      isA
                        ? "border-[#D4A853]/40 bg-gradient-to-r from-[#1a1510] to-card"
                        : isB
                          ? "border-[#9CA3AF]/30 bg-card"
                          : "border-border bg-card"
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="relative h-auto w-[160px] shrink-0 overflow-hidden bg-muted md:w-[200px]">
                      {partner.thumbnailUrl ? (
                        <Image
                          src={partner.thumbnailUrl}
                          alt={partner.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full min-h-[140px] items-center justify-center text-5xl">
                          {catInfo?.emoji || "🏢"}
                        </div>
                      )}
                      <div className="absolute left-2 top-2 flex items-center gap-1 rounded bg-black/70 px-2 py-0.5 text-[11px] text-white">
                        <span>{catInfo?.emoji}</span>
                        <span>{catInfo?.label}</span>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2 pt-6">
                        <span className={`text-sm font-bold ${isA ? "text-[#D4A853]" : "text-white"}`}>
                          {partner.name}
                        </span>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex flex-1 flex-col justify-center gap-1.5 p-4">
                      <p className="text-[15px] font-bold">{partner.name}</p>
                      {partner.description && (
                        <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                          {partner.description}
                        </p>
                      )}
                      {partner.highlight && (
                        <p className="text-[13px] font-semibold" style={{ color: gradeInfo?.color }}>
                          {partner.highlight}
                        </p>
                      )}
                      <div className="mt-1 flex items-center gap-2">
                        <span
                          className="rounded border px-1.5 py-0.5 text-[11px]"
                          style={{
                            borderColor: `${catInfo?.color}40`,
                            color: catInfo?.color,
                            background: `${catInfo?.color}15`,
                          }}
                        >
                          {catInfo?.label}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {regionLabel}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          조회 {partner.viewCount}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            <div className="pb-3 pt-2 text-right">
              <Link href="/partner" className="text-sm text-primary hover:underline">
                더보기 →
              </Link>
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
                <TierCard key={ad.id} ad={ad} tier="SPECIAL"  />
              ))}
            </div>
            <div className="pb-3 pt-2 text-right">
              <Link href="/jobs?productId=SPECIAL" className="text-sm text-special hover:underline">더보기 →</Link>
            </div>
          </div>
        </section>
      )}

      {/* URGENT + RECOMMEND Section - 2 Column Grid */}
      {(urgentAds.length > 0 || recommendAds.length > 0) && (
        <section className="border-b">
          <div className="grid gap-4 px-2 py-3 sm:p-4 md:grid-cols-2">
            {/* Urgent Column */}
            {urgentAds.length > 0 && (
              <div className="rounded-xl bg-urgent/5 p-3 sm:p-4">
                <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
                  <span className="animate-pulse-urgent rounded bg-urgent px-2 py-0.5 text-xs font-bold text-white">
                    급구
                  </span>
                  급구 채용정보
                </h2>
                <div className="space-y-1.5">
                  {urgentAds.map((ad) => (
                    <AdBoxCard key={ad.id} ad={ad} productId="URGENT" compact />
                  ))}
                </div>
                <Link href="/jobs?productId=URGENT" className="mt-2 block text-right text-sm text-urgent hover:underline">더보기 →</Link>
              </div>
            )}
            {/* Recommend Column */}
            {recommendAds.length > 0 && (
              <div className="rounded-xl bg-recommend/5 p-3 sm:p-4">
                <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
                  <span className="rounded bg-recommend/20 px-2 py-0.5 text-xs font-bold text-recommend">
                    추천
                  </span>
                  추천 채용정보
                </h2>
                <div className="space-y-1.5">
                  {recommendAds.map((ad) => (
                    <AdBoxCard key={ad.id} ad={ad} productId="RECOMMEND" compact />
                  ))}
                </div>
                <Link href="/jobs?productId=RECOMMEND" className="mt-2 block text-right text-sm text-primary hover:underline">더보기 →</Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Community + Resume Info - 2 Column Layout */}
      {(postsAll.length > 0 || recentResumes.length > 0) && (
        <section className="border-b px-4 py-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Community */}
            {postsAll.length > 0 && (
              <div className="flex flex-col">
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
                <CommunitySection hotPost={hotPost} postsByCategory={{ ALL: postsAll, CHAT: postsCHAT, BEAUTY: postsBEAUTY, QNA: postsQNA, WORK: postsWORK }} />
              </div>
            )}

            {/* Resume Info */}
            {recentResumes.length > 0 && (
              <div className="flex flex-col">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold">인재정보</h2>
                  <Link href="/resumes">
                    <Button variant="outline" size="sm">더보기</Button>
                  </Link>
                </div>
                <div className="flex-1 divide-y divide-border rounded-lg border bg-card">
                  {recentResumes.map((resume) => {
                    const regionLabel = REGIONS[resume.region]?.shortLabel || resume.region;
                    const expLabel = EXPERIENCE_LEVELS.find((e) => e.value === resume.experienceLevel)?.label || "";
                    const jobLabels = (resume.desiredJobs || []).slice(0, 2).map((j) => BUSINESS_TYPES[j]?.shortLabel || j);
                    return (
                      <Link key={resume.id} href="/resumes" className="block px-4 py-3 text-sm transition-colors hover:bg-muted/50">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium">{resume.nickname}</span>
                          {resume.age && <span className="text-muted-foreground">{resume.age}세</span>}
                          <span className="text-muted-foreground">·</span>
                          <span className="text-muted-foreground">{regionLabel}</span>
                          {jobLabels.length > 0 && (
                            <>
                              <span className="text-muted-foreground">·</span>
                              <span className="truncate text-muted-foreground">{jobLabels.join(", ")}</span>
                            </>
                          )}
                          {expLabel && (
                            <>
                              <span className="text-muted-foreground">·</span>
                              <span className="text-muted-foreground">{expLabel}</span>
                            </>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* LINE Section - Compact List */}
      <section id="line-ads" className="border-b scroll-mt-16">
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="border-l-4 border-primary pl-3 text-xl font-bold">
            줄광고
          </h2>
          <Link href="/jobs?productId=LINE" className="text-sm text-primary hover:underline">더보기 →</Link>
        </div>

        {lineAds.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            <p className="text-lg">등록된 채용정보가 없습니다</p>
            <p className="mt-1 text-sm">첫 광고를 등록해보세요!</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {lineAds.map((ad, idx) => {
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
                  <div className={`hidden items-center gap-3 px-4 py-3 text-sm md:flex ${idx % 2 === 1 ? "bg-muted/5" : ""}`}>
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

      </section>

      {/* Section Divider */}
      <div className="h-3 bg-muted/30" />

      {/* FREE Section - Basic Text List */}
      {freeAds.length > 0 && (
        <section className="border-b">
          <div className="flex items-center justify-between px-4 py-3">
            <h2 className="border-l-4 border-muted-foreground/30 pl-3 text-lg font-bold text-muted-foreground">
              무료 채용정보
            </h2>
            <Link href="/jobs?productId=FREE" className="text-sm text-muted-foreground hover:underline">더보기 →</Link>
          </div>
          <div className="divide-y divide-border">
            {freeAds.map((ad) => {
              const regionLabels = ad.regions.map((r) => REGIONS[r]?.shortLabel || r).join(", ");
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

      {/* 서비스 특징 */}
      <section className="border-b px-4 py-6">
        <h2 className="mb-4 text-lg font-bold">왜 여시잡인가요?</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { icon: "🛡", label: "검증된 업소", desc: "국세청 API로 사업자 인증" },
            { icon: "⚡", label: "빠른 채용", desc: "이력서 한 번으로 간편 지원" },
            { icon: "📍", label: "전국 커버", desc: "서울~제주 전국 채용정보" },
            { icon: "💬", label: "커뮤니티", desc: "현직자 정보 공유 · 후기" },
          ].map((f) => (
            <div key={f.label} className="rounded-xl border bg-card p-4 text-center">
              <p className="text-2xl">{f.icon}</p>
              <p className="mt-1.5 text-sm font-bold">{f.label}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 이용 가이드 + CTA */}
      <section className="bg-gradient-to-r from-transparent via-primary/5 to-transparent">
        {/* 모바일: 기존 세로 레이아웃 */}
        <div className="md:hidden">
          {/* 미니 가이드 */}
          <div className="border-b px-4 py-5 text-center">
            <p className="text-sm font-bold">처음이신가요? 3단계로 시작</p>
            <div className="mt-3 flex items-center justify-center gap-1.5">
              {[
                { icon: "📝", text: "회원가입" },
                { icon: "📄", text: "이력서 등록" },
                { icon: "🎯", text: "지원하기" },
              ].map((s, i) => (
                <div key={s.text} className="flex items-center gap-1.5">
                  {i > 0 && <span className="text-xs text-muted-foreground">→</span>}
                  <div className="rounded-lg border bg-card px-3 py-2 text-center">
                    <p className="text-lg">{s.icon}</p>
                    <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground">{s.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* 슬림 CTA */}
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-primary">사장님이신가요?</p>
              <p className="text-[11px] text-muted-foreground">광고 등록은 무료부터 시작</p>
            </div>
            <Link href="/business/ads/new">
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                광고 등록
              </Button>
            </Link>
          </div>
        </div>

        {/* PC: 좌우 배치 */}
        <div className="hidden md:flex items-center gap-6 px-4 py-5">
          {/* 왼쪽: 가이드 */}
          <div className="flex-1">
            <p className="text-sm font-bold">처음이신가요? 3단계로 시작</p>
            <div className="mt-3 flex items-center gap-1.5">
              {[
                { icon: "📝", text: "회원가입" },
                { icon: "📄", text: "이력서 등록" },
                { icon: "🎯", text: "지원하기" },
              ].map((s, i) => (
                <div key={s.text} className="flex items-center gap-1.5">
                  {i > 0 && <span className="text-xs text-muted-foreground">→</span>}
                  <div className="rounded-lg border bg-card px-3 py-2 text-center">
                    <p className="text-lg">{s.icon}</p>
                    <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground">{s.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* 구분선 */}
          <div className="h-12 w-px bg-border" />
          {/* 오른쪽: CTA */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-primary">사장님이신가요?</p>
              <p className="text-[11px] text-muted-foreground">광고 등록은 무료부터 시작</p>
            </div>
            <Link href="/business/ads/new">
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                광고 등록
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
