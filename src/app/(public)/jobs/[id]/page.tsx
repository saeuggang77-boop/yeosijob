import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { REGIONS } from "@/lib/constants/regions";
import { BUSINESS_TYPES } from "@/lib/constants/business-types";
import { formatDate, formatPhone } from "@/lib/utils/format";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { ScrapButton } from "@/components/scraps/ScrapButton";
import { ShareButton } from "@/components/share/ShareButton";
import { KakaoMap } from "@/components/map/KakaoMap";
import { Banner } from "@/components/ads/Banner";
import GradeBadge from "@/components/ads/GradeBadge";
import { calculateDday, getDdayColorClass } from "@/lib/utils/dday";
import type { Region } from "@/generated/prisma/client";
import { FloatingContact } from "@/components/ads/FloatingContact";
import { AdDetailGallery } from "@/components/ads/AdDetailGallery";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const ad = await prisma.ad.findUnique({
    where: { id },
    select: {
      title: true,
      businessName: true,
      regions: true,
      businessType: true
    },
  });

  if (!ad) {
    return { title: "채용정보를 찾을 수 없습니다" };
  }

  const regionLabels = ad.regions
    .map((r: Region) => REGIONS[r]?.label || r)
    .join(", ");
  const bizLabel = BUSINESS_TYPES[ad.businessType]?.label || ad.businessType;
  const description = `${ad.businessName} - ${regionLabels} ${bizLabel} 채용정보`;

  return {
    title: ad.title,
    description,
    openGraph: {
      type: "article",
      title: `${ad.title} | 여시잡`,
      description,
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "여시잡 - 유흥알바 No.1 구인구직" }],
    },
  };
}

export default async function JobDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();

  const ad = await prisma.ad.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      businessName: true,
      businessType: true,
      contactPhone: true,
      contactKakao: true,
      contactTelegram: true,
      salaryText: true,
      workHours: true,
      benefits: true,
      workEnvironment: true,
      safetyInfo: true,
      regions: true,
      address: true,
      addressDetail: true,
      locationHint: true,
      productId: true,
      status: true,
      viewCount: true,
      createdAt: true,
      endDate: true,
      isVerified: true,
      bannerTitle: true,
      bannerSubtitle: true,
      bannerTemplate: true,
      bannerColor: true,
      detailImages: true,
      user: {
        select: { isVerifiedBiz: true, totalPaidAdDays: true },
      },
      reviews: {
        where: { isHidden: false },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          rating: true,
          content: true,
          createdAt: true,
          user: { select: { name: true } },
        },
      },
      _count: {
        select: { reviews: { where: { isHidden: false } } },
      },
    },
  });

  if (!ad || ad.status !== "ACTIVE") {
    notFound();
  }

  // Check if user has scraped this ad
  const isScraped = session?.user?.role === "JOBSEEKER"
    ? await prisma.scrap.findUnique({
        where: {
          userId_adId: {
            userId: session.user.id,
            adId: id,
          },
        },
      }).then(scrap => !!scrap)
    : false;

  // Check if user has already reviewed this ad
  const hasReviewed = session?.user?.role === "JOBSEEKER"
    ? await prisma.review.findUnique({
        where: {
          adId_userId: {
            adId: id,
            userId: session.user.id,
          },
        },
      }).then(review => !!review)
    : false;

  const hasResume = session?.user?.role === "JOBSEEKER"
    ? await prisma.resume.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      }).then(r => !!r)
    : true; // non-jobseekers don't need this check

  // 조회수 증가 + 일별 메트릭 기록 (fire and forget)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  Promise.all([
    prisma.ad.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    }),
    prisma.adDailyMetric.upsert({
      where: {
        adId_date: {
          adId: id,
          date: today,
        },
      },
      update: {
        views: { increment: 1 },
      },
      create: {
        adId: id,
        date: today,
        views: 1,
        clicks: 0,
      },
    }),
  ]).catch(() => {});

  const regionLabels = ad.regions
    .map((r: Region) => REGIONS[r]?.label || r)
    .join(", ");
  const bizLabel =
    BUSINESS_TYPES[ad.businessType]?.label || ad.businessType;

  const avgRating =
    ad.reviews.length > 0
      ? (
          ad.reviews.reduce((sum, r) => sum + r.rating, 0) / ad.reviews.length
        ).toFixed(1)
      : null;

  // D-day calculation (only for non-FREE ads)
  const ddayInfo = ad.productId !== "FREE" ? calculateDday(ad.endDate) : null;

  // JSON-LD structured data for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: ad.title,
    description: ad.description,
    datePosted: ad.createdAt.toISOString(),
    employmentType: "FULL_TIME",
    hiringOrganization: {
      "@type": "Organization",
      name: ad.businessName,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressRegion: regionLabels,
        addressCountry: "KR",
      },
    },
    baseSalary: {
      "@type": "MonetaryAmount",
      currency: "KRW",
      value: {
        "@type": "QuantitativeValue",
        value: ad.salaryText,
      },
    },
  };

  // Add validThrough if endDate exists
  if (ad.endDate) {
    (jsonLd as Record<string, unknown>).validThrough = ad.endDate.toISOString();
  }

  return (
    <div className="mx-auto max-w-screen-md px-4 py-6">
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      {/* 배너 (유료 광고만) */}
      {ad.productId !== "FREE" && (
        <div className="mb-6">
          <Banner
            title={ad.bannerTitle}
            subtitle={ad.bannerSubtitle}
            businessName={ad.businessName}
            businessIcon={BUSINESS_TYPES[ad.businessType]?.icon}
            businessLabel={BUSINESS_TYPES[ad.businessType]?.shortLabel}
            businessType={ad.businessType}
            salaryText={ad.salaryText}
            regionLabel={regionLabels}
            template={ad.bannerTemplate ?? 0}
            colorIndex={ad.bannerColor ?? 0}
            size="lg"
          />
        </div>
      )}

      {/* 상단 정보 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:underline">
            홈
          </Link>
          <span>/</span>
          <span>채용 상세</span>
        </div>

        <div className="mt-3 flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold">{ad.title}</h1>
          <div className="flex shrink-0 items-center gap-1">
            <ShareButton
              title={`${ad.title} - ${ad.businessName}`}
              description={`${regionLabels} ${bizLabel} | ${ad.salaryText}`}
            />
            {session?.user?.role === "JOBSEEKER" && (
              <ScrapButton adId={id} initialScraped={isScraped} />
            )}
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-lg font-semibold">{ad.businessName}</span>
          <GradeBadge totalPaidAdDays={ad.user?.totalPaidAdDays ?? 0} size="md" showDays={true} />
          {(ad.isVerified || ad.user.isVerifiedBiz) && (
            <Badge variant="secondary">인증업소</Badge>
          )}
          {avgRating && (
            <span className="text-sm text-muted-foreground">
              {"★"} {avgRating} ({ad._count.reviews})
            </span>
          )}
          {ddayInfo && (
            <Badge
              className={`px-2 py-0.5 text-xs font-bold ${getDdayColorClass(ddayInfo.color)}`}
            >
              {ddayInfo.text}
            </Badge>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="outline">{regionLabels}</Badge>
          <Badge variant="outline">{bizLabel}</Badge>
        </div>
      </div>

      <Separator />

      {/* 급여 및 근무조건 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">급여 및 근무조건</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-start justify-between gap-4">
            <span className="shrink-0 text-muted-foreground">급여</span>
            <span className="text-right font-semibold text-success">{ad.salaryText}</span>
          </div>
          {ad.workHours && (
            <div className="flex items-start justify-between gap-4">
              <span className="shrink-0 text-muted-foreground">근무시간</span>
              <span className="text-right">{ad.workHours}</span>
            </div>
          )}
          <div className="flex items-start justify-between gap-4">
            <span className="shrink-0 text-muted-foreground">조회수</span>
            {ad.viewCount < 50 ? (
              <Badge variant="secondary" className="text-xs">NEW</Badge>
            ) : (
              <span>{ad.viewCount.toLocaleString()}회</span>
            )}
          </div>
          <div className="flex items-start justify-between gap-4">
            <span className="shrink-0 text-muted-foreground">등록일</span>
            <span>{formatDate(ad.createdAt)}</span>
          </div>
        </CardContent>
      </Card>

      {/* 위치 정보 */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-lg">위치</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          {ad.address ? (
            <div className="space-y-1">
              <p className="font-medium">{ad.address}</p>
              {ad.addressDetail && (
                <p className="text-muted-foreground">{ad.addressDetail}</p>
              )}
              <KakaoMap address={ad.address} />
            </div>
          ) : ad.locationHint ? (
            <p className="font-medium">{ad.locationHint}</p>
          ) : (
            <p className="text-muted-foreground">{regionLabels}</p>
          )}
        </CardContent>
      </Card>

      {/* 채용 상세 */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-lg">채용 상세</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 상세 설명 */}
          <div>
            <h4 className="mb-1 font-medium text-sm text-muted-foreground">상세 설명</h4>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {ad.description}
            </div>
          </div>

          {/* 근무환경 */}
          {ad.workEnvironment && (
            <div className="border-t pt-3">
              <h4 className="mb-1 font-medium text-sm text-muted-foreground">근무환경</h4>
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {ad.workEnvironment}
              </div>
            </div>
          )}

          {/* 안전/보안 */}
          {ad.safetyInfo && (
            <div className="border-t pt-3">
              <h4 className="mb-1 font-medium text-sm text-muted-foreground">안전 / 보안</h4>
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {ad.safetyInfo}
              </div>
            </div>
          )}

          {/* 상세 이미지 */}
          {ad.detailImages && ad.detailImages.length > 0 && (
            <div className="border-t pt-3">
              <AdDetailGallery images={ad.detailImages.filter((url: string) =>
                url.startsWith("https://") && url.includes("vercel-storage.com")
              )} />
            </div>
          )}

          {/* 복지/혜택 (기존 benefits) */}
          {ad.benefits && (
            <div className="border-t pt-3">
              <h4 className="mb-1 font-medium text-sm text-muted-foreground">복지 / 혜택</h4>
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {ad.benefits}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 연락처 */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-lg">연락처</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">전화</span>
            <a
              href={`tel:${ad.contactPhone}`}
              className="font-medium text-primary hover:underline"
            >
              {formatPhone(ad.contactPhone)}
            </a>
          </div>
          {ad.contactKakao && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">카카오톡</span>
              <span className="font-medium">{ad.contactKakao}</span>
            </div>
          )}
          {ad.contactTelegram && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">텔레그램</span>
              <a
                href={`https://t.me/${ad.contactTelegram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline"
              >
                {ad.contactTelegram}
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 이력서 등록 안내 (JOBSEEKER without resume) */}
      {session?.user?.role === "JOBSEEKER" && !hasResume && (
        <Card className="mt-4 border-primary/30 bg-primary/5">
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="font-medium">이력서를 먼저 등록해주세요</p>
              <p className="mt-0.5 text-sm text-muted-foreground">이력서를 등록하면 업소에서 직접 연락합니다</p>
            </div>
            <Link href="/jobseeker/my-resume">
              <Button size="sm">등록하기</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* 후기 미리보기 */}
      {ad.reviews.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-lg">
              후기 ({ad._count.reviews})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {ad.reviews.map((review) => (
              <div key={review.id} className="border-b pb-3 last:border-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {review.user.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)}{" "}
                    {formatDate(review.createdAt)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {review.content}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 후기 작성 폼 */}
      {session?.user?.role === "JOBSEEKER" && (
        <div className="mt-4">
          {hasReviewed ? (
            <Card>
              <CardContent className="py-6 text-center text-sm text-muted-foreground">
                이미 후기를 작성했습니다
              </CardContent>
            </Card>
          ) : (
            <ReviewForm adId={id} />
          )}
        </div>
      )}

      {/* 플로팅 연락처 바 */}
      <FloatingContact
        contactPhone={ad.contactPhone}
        contactKakao={ad.contactKakao}
        contactTelegram={ad.contactTelegram}
        isJobseekerWithoutResume={session?.user?.role === "JOBSEEKER" && !hasResume}
      />

      {/* 하단 여백 (모바일 고정바) */}
      <div className="h-20 md:hidden" />
    </div>
  );
}
