import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { PARTNER_CATEGORIES } from "@/lib/constants/partners";
import { REGIONS } from "@/lib/constants/regions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, MapPin, Clock, Phone, MessageCircle, Globe, Eye, Star } from "lucide-react";
import { ShareButton } from "@/components/share/ShareButton";
import { PartnerReviewForm } from "@/components/reviews/PartnerReviewForm";
import { PartnerReplyForm } from "@/components/reviews/PartnerReplyForm";
import { GoogleMap } from "@/components/map/GoogleMap";
import { formatDate, formatPhone } from "@/lib/utils/format";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 60;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const partner = await prisma.partner.findFirst({
    where: { id, status: "ACTIVE", isProfileComplete: true },
    select: { name: true, category: true, region: true, description: true },
  });

  if (!partner) {
    return { title: "제휴업체를 찾을 수 없습니다" };
  }

  const categoryInfo = PARTNER_CATEGORIES[partner.category];
  const regionLabel = REGIONS[partner.region]?.label || partner.region;
  const description = partner.description
    ? partner.description.slice(0, 160)
    : `${partner.name} - ${regionLabel} ${categoryInfo?.label || ""} | 여시잡 제휴업체`;

  return {
    title: `${partner.name} - ${categoryInfo?.label || "제휴업체"}`,
    description,
    alternates: {
      canonical: `/partner/${id}`,
    },
    openGraph: {
      type: "article",
      title: `${partner.name} | 여시잡 제휴업체`,
      description,
    },
  };
}

export default async function PartnerDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [partner, session] = await Promise.all([
    prisma.partner.findFirst({
      where: { id, status: "ACTIVE", isProfileComplete: true },
      select: {
        id: true,
        userId: true,
        name: true,
        category: true,
        region: true,
        address: true,
        description: true,
        highlight: true,
        thumbnailUrl: true,
        detailImages: true,
        contactPhone: true,
        contactKakao: true,
        websiteUrl: true,
        businessHours: true,
        grade: true,
        isVerifiedBiz: true,
        viewCount: true,
        partnerReviews: {
          where: { isHidden: false },
          include: {
            user: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { partnerReviews: { where: { isHidden: false } } },
        },
      },
    }),
    auth(),
  ]);

  if (!partner) {
    notFound();
  }

  // Increment view count
  await prisma.partner.update({
    where: { id: partner.id },
    data: { viewCount: { increment: 1 } },
  });

  const categoryInfo = PARTNER_CATEGORIES[partner.category];
  const regionLabel = REGIONS[partner.region]?.label || partner.region;

  // Check if current user already reviewed
  const isJobseeker = session?.user?.role === "JOBSEEKER";
  const isOwner = session?.user?.id === partner.userId;
  const hasReviewed = isJobseeker
    ? partner.partnerReviews.some((r) => r.userId === session.user.id)
    : false;

  // Calculate average rating
  const avgRating =
    partner.partnerReviews.length > 0
      ? partner.partnerReviews.reduce((sum, r) => sum + r.rating, 0) / partner.partnerReviews.length
      : 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* JSON-LD BreadcrumbList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "홈", item: "https://yeosijob.com" },
              { "@type": "ListItem", position: 2, name: "제휴업체", item: "https://yeosijob.com/partner" },
              { "@type": "ListItem", position: 3, name: partner.name },
            ],
          }).replace(/</g, "\\u003c"),
        }}
      />
      {/* JSON-LD LocalBusiness */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: partner.name,
            description: partner.description,
            ...(partner.address && { address: { "@type": "PostalAddress", streetAddress: partner.address, addressCountry: "KR" } }),
            ...(partner.contactPhone && { telephone: partner.contactPhone }),
            ...(partner.websiteUrl && { url: partner.websiteUrl }),
            ...(partner.thumbnailUrl && { image: partner.thumbnailUrl }),
            ...(avgRating > 0 && {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: avgRating.toFixed(1),
                reviewCount: partner.partnerReviews.length,
              },
            }),
          }).replace(/</g, "\\u003c"),
        }}
      />

      {/* Back button */}
      <Link href="/partner" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        제휴업체 목록으로
      </Link>

      {/* Main Image */}
      {partner.thumbnailUrl && (
        <div className="mb-6 overflow-hidden rounded-xl">
          <Image
            src={partner.thumbnailUrl}
            alt={partner.name}
            width={800}
            height={400}
            className="h-[300px] w-full object-cover"
          />
        </div>
      )}

      {/* Business Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold tracking-tight">{partner.name}</h1>
                {partner.isVerifiedBiz && (
                  <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    인증업체
                  </span>
                )}
                <ShareButton
                  title={`${partner.name} - ${categoryInfo.label}`}
                  description={`${regionLabel} ${categoryInfo.label} | 여시잡 제휴업체`}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  style={{ backgroundColor: categoryInfo.color }}
                  className="text-white border-0"
                >
                  {categoryInfo.emoji} {categoryInfo.label}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  <MapPin className="inline h-3 w-3" /> {regionLabel}
                </span>
                <span className="text-sm text-muted-foreground">
                  <Eye className="inline h-3 w-3" /> 조회 {partner.viewCount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {partner.address && (
            <div className="flex gap-2">
              <MapPin className="h-5 w-5 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">주소</p>
                <p className="text-sm text-muted-foreground">{partner.address}</p>
              </div>
            </div>
          )}
          {partner.businessHours && (
            <div className="flex gap-2">
              <Clock className="h-5 w-5 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">영업시간</p>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{partner.businessHours}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Highlight + Description Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>소개</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {partner.highlight && (
            <p
              className="text-lg font-semibold"
              style={{ color: categoryInfo?.color }}
            >
              {partner.highlight}
            </p>
          )}
          <p className="whitespace-pre-line text-sm text-muted-foreground">
            {partner.description}
          </p>
        </CardContent>
      </Card>

      {/* Contact Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>연락처</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {partner.contactPhone && (
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <a
                href={`tel:${partner.contactPhone}`}
                className="text-sm font-medium hover:underline"
              >
                {formatPhone(partner.contactPhone)}
              </a>
            </div>
          )}
          {partner.contactKakao && (
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-muted-foreground" />
              <a
                href={partner.contactKakao.match(/^https?:\/\//) ? partner.contactKakao : `https://${partner.contactKakao}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium hover:underline"
              >
                카카오톡 문의
              </a>
            </div>
          )}
          {partner.websiteUrl && (
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-muted-foreground" />
              <a
                href={partner.websiteUrl.match(/^https?:\/\//) ? partner.websiteUrl : `https://${partner.websiteUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium hover:underline"
              >
                홈페이지 방문
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Images */}
      {partner.detailImages.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>상세 이미지</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {partner.detailImages.map((img, idx) => (
                <Image
                  key={idx}
                  src={img}
                  alt={`${partner.name} 상세 이미지 ${idx + 1}`}
                  width={800}
                  height={600}
                  className="w-full rounded-lg"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Map Section */}
      {partner.address && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>위치</CardTitle>
          </CardHeader>
          <CardContent>
            <GoogleMap address={partner.address} />
            <div className="mt-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{partner.address}</span>
            </div>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(partner.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-xs text-primary hover:underline"
            >
              Google Maps에서 크게 보기 →
            </a>
          </CardContent>
        </Card>
      )}

      {/* Reviews Section */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              이용 후기
              <Badge variant="secondary">{partner._count.partnerReviews}건</Badge>
            </CardTitle>
            {avgRating > 0 && (
              <div className="flex items-center gap-1 text-sm">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{avgRating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {partner.partnerReviews.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              아직 이용 후기가 없습니다. 첫 번째 후기를 작성해보세요!
            </p>
          ) : (
            <div className="space-y-4">
              {partner.partnerReviews.map((review) => {
                const stars = Array.from({ length: 5 }, (_, i) => i < review.rating);
                return (
                  <div key={review.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {review.user.name || "익명"}
                        </span>
                        <div className="flex gap-0.5">
                          {stars.map((filled, i) => (
                            <span key={i} className={filled ? "text-yellow-400 text-sm" : "text-gray-300 text-sm"}>
                              {filled ? "★" : "☆"}
                            </span>
                          ))}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{review.content}</p>

                    {/* 사장님 답글 */}
                    {review.reply && (
                      <div className="mt-3 ml-4 rounded-md border bg-muted/50 p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-primary">사장님 답글</span>
                          <span className="text-xs text-muted-foreground">
                            {review.repliedAt && formatDate(review.repliedAt)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{review.reply}</p>
                      </div>
                    )}

                    {/* 사장님 답글 작성/수정 폼 */}
                    {isOwner && (
                      <div className="ml-4">
                        <PartnerReplyForm reviewId={review.id} existingReply={review.reply} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Form */}
      {isJobseeker && !hasReviewed && (
        <div className="mb-6">
          <PartnerReviewForm partnerId={partner.id} />
        </div>
      )}

      {isJobseeker && hasReviewed && (
        <Card className="mb-6">
          <CardContent className="py-4 text-center text-sm text-muted-foreground">
            이미 이 업체에 후기를 작성했습니다.
          </CardContent>
        </Card>
      )}

      {/* Bottom CTA */}
      <div className="mt-8 rounded-lg border bg-muted/30 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          이 업체에 대해 더 알고 싶으신가요?
        </p>
        {partner.contactKakao ? (
          <Link href={partner.contactKakao.match(/^https?:\/\//) ? partner.contactKakao : `https://${partner.contactKakao}`} target="_blank" rel="noopener noreferrer">
            <Button className="mt-3">
              <MessageCircle className="mr-2 h-4 w-4" />
              카카오톡으로 문의하기
            </Button>
          </Link>
        ) : partner.contactPhone ? (
          <a href={`tel:${partner.contactPhone}`}>
            <Button className="mt-3">
              <Phone className="mr-2 h-4 w-4" />
              전화로 문의하기
            </Button>
          </a>
        ) : null}
      </div>
    </div>
  );
}
