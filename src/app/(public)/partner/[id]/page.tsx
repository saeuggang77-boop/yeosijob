import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { PARTNER_CATEGORIES, PARTNER_GRADES } from "@/lib/constants/partners";
import { REGIONS } from "@/lib/constants/regions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, MapPin, Clock, Phone, MessageCircle, Globe, Eye, Star } from "lucide-react";
import { PartnerReviewForm } from "@/components/reviews/PartnerReviewForm";
import { formatDate, formatPhone } from "@/lib/utils/format";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 60;

export default async function PartnerDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [partner, session] = await Promise.all([
    prisma.partner.findFirst({
      where: { id, status: "ACTIVE", isProfileComplete: true },
      select: {
        id: true,
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
  const gradeInfo = PARTNER_GRADES[partner.grade];
  const regionLabel = REGIONS[partner.region]?.label || partner.region;

  const gradeColor = gradeInfo.color;

  // Check if current user already reviewed
  const isJobseeker = session?.user?.role === "JOBSEEKER";
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
                <CardTitle className="text-2xl">{partner.name}</CardTitle>
                <Badge
                  style={{ backgroundColor: gradeColor }}
                  className="shrink-0 text-white border-0"
                >
                  {gradeInfo.label}
                </Badge>
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
              style={{ color: partner.grade === "A" ? "#D4A853" : undefined }}
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
                href={partner.contactKakao}
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
                href={partner.websiteUrl}
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
          <Link href={partner.contactKakao} target="_blank" rel="noopener noreferrer">
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
