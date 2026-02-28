import { redirect, notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { REGIONS } from "@/lib/constants/regions";
import { BUSINESS_TYPES } from "@/lib/constants/business-types";
import { EXPERIENCE_LEVELS, SALARY_TYPES } from "@/lib/constants/resume";
import { AD_PRODUCTS } from "@/lib/constants/products";
import { formatPhone, formatPrice } from "@/lib/utils/format";
import type { BusinessType } from "@/generated/prisma/client";

interface PageProps {
  params: Promise<{ id: string }>;
}

function maskKakao(kakaoId: string): string {
  if (kakaoId.length <= 4) return kakaoId.slice(0, 1) + "***";
  return kakaoId.slice(0, 4) + "*".repeat(Math.min(kakaoId.length - 4, 5));
}

function maskPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length >= 10) {
    return digits.slice(0, 3) + "-****-" + digits.slice(-4);
  }
  return phone.slice(0, 3) + "****";
}

export default async function ResumeDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session || (session.user.role !== "BUSINESS" && session.user.role !== "ADMIN")) redirect("/login");

  const isAdmin = session.user.role === "ADMIN";
  const { id } = await params;

  const resume = await prisma.resume.findUnique({
    where: { id },
    include: {
      user: {
        select: { phone: true, name: true },
      },
    },
  });

  if (
    !resume ||
    !resume.isPublic
  ) {
    notFound();
  }

  // Fetch active ads to determine tier (exclude FREE) - skip for admin
  const activeAds = isAdmin ? [] : await prisma.ad.findMany({
    where: { userId: session.user.id, status: "ACTIVE", productId: { not: "FREE" } },
    select: { id: true, productId: true },
  });

  const hasActiveAd = isAdmin || activeAds.length > 0;

  // Determine best product tier
  let bestProductId = "";
  let bestAdId = "";
  let dailyLimit = 0;
  let isUnlimited = isAdmin; // Admin always has unlimited access

  if (!isAdmin && activeAds.length > 0) {
    bestProductId = activeAds.reduce((best, ad) => {
      const currentRank = AD_PRODUCTS[ad.productId]?.rank ?? 999;
      const bestRank = AD_PRODUCTS[best]?.rank ?? 999;
      return currentRank < bestRank ? ad.productId : best;
    }, activeAds[0].productId);
    bestAdId = activeAds.find((ad) => ad.productId === bestProductId)?.id || activeAds[0].id;
    dailyLimit = AD_PRODUCTS[bestProductId]?.resumeViewLimit ?? 3;
    isUnlimited = dailyLimit >= 9999;
  }

  // Check today's views (use $queryRaw with explicit KST midnight to avoid PrismaPg date issues)
  let viewedResumeIds: string[] = [];
  let alreadyViewedToday = false;

  if (hasActiveAd) {
    // Calculate KST midnight as UTC timestamp
    const now = new Date();
    const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const kstMidnightUTC = new Date(
      Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate()) - 9 * 60 * 60 * 1000
    );
    const cutoff = kstMidnightUTC.toISOString();

    const viewedToday = await prisma.$queryRaw<{ resumeId: string }[]>`
      SELECT DISTINCT "resumeId"
      FROM resume_view_logs
      WHERE "userId" = ${session.user.id}
        AND "viewedAt" >= ${cutoff}::timestamptz
    `;
    viewedResumeIds = viewedToday.map((v) => v.resumeId);
    alreadyViewedToday = viewedResumeIds.includes(id);
  }

  // Determine if contact info can be viewed
  const limitExceeded = hasActiveAd && !isUnlimited && !alreadyViewedToday && viewedResumeIds.length >= dailyLimit;
  const canViewContact = hasActiveAd && !limitExceeded;

  // Log view if allowed
  if (canViewContact && !alreadyViewedToday) {
    await prisma.resumeViewLog.create({
      data: {
        userId: session.user.id,
        resumeId: id,
        adId: bestAdId,
      },
    });
  }

  const experienceLabel =
    EXPERIENCE_LEVELS.find((e) => e.value === resume.experienceLevel)?.label ||
    resume.experienceLevel;

  let salaryInfo = "";
  if (resume.desiredSalaryType) {
    const salaryTypeLabel = SALARY_TYPES.find(
      (s) => s.value === resume.desiredSalaryType
    )?.label;
    if (resume.desiredSalaryType === "NEGOTIABLE") {
      salaryInfo = "면접후협의";
    } else if (salaryTypeLabel && resume.desiredSalaryAmount) {
      salaryInfo = `${salaryTypeLabel} ${formatPrice(resume.desiredSalaryAmount)}원`;
    }
  }

  // Resolve contact info (masked or real)
  const rawPhone = resume.phone || resume.user.phone || "";
  const rawKakao = resume.kakaoId || "";

  const displayPhone = canViewContact
    ? rawPhone ? formatPhone(rawPhone) : "미등록"
    : rawPhone ? maskPhoneNumber(rawPhone) : "미등록";

  const displayKakao = canViewContact
    ? rawKakao
    : rawKakao ? maskKakao(rawKakao) : "";

  // Reason for restriction
  let restrictionReason = "";
  if (!hasActiveAd) {
    restrictionReason = "이력서 열람은 유료 등급부터 가능합니다. 업그레이드하기";
  } else if (limitExceeded) {
    restrictionReason = `오늘 열람 가능 횟수(${dailyLimit}건)를 초과했습니다. 상위 등급 광고를 이용하면 더 많은 인재를 확인할 수 있습니다`;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/business/resumes">
          <Button variant="ghost" size="sm">
            ← 목록으로
          </Button>
        </Link>
        {hasActiveAd && !isUnlimited && (
          <Badge variant={limitExceeded ? "destructive" : "secondary"}>
            오늘 {viewedResumeIds.length + (canViewContact && !alreadyViewedToday ? 1 : 0)}/{dailyLimit}건 열람
          </Badge>
        )}
      </div>

      <div className="space-y-4">
        {/* Photo */}
        {resume.photoUrl && (
          <Card>
            <CardContent className="py-6">
              <div className="flex justify-center">
                <Image
                  src={resume.photoUrl}
                  alt="프로필 사진"
                  width={320}
                  height={320}
                  className="max-w-xs rounded-lg"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-24 text-sm font-medium text-muted-foreground">닉네임</span>
              <span className="font-medium">{resume.nickname}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-24 text-sm font-medium text-muted-foreground">성별</span>
              <span>{resume.gender}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-24 text-sm font-medium text-muted-foreground">나이</span>
              <span>{resume.age}세</span>
            </div>
            {resume.bodyType && (
              <div className="flex items-center gap-3">
                <span className="w-24 text-sm font-medium text-muted-foreground">체형</span>
                <span>{resume.bodyType === "SLIM" ? "슬림" : resume.bodyType === "NORMAL" ? "보통" : resume.bodyType === "GLAMOUR" ? "글래머" : resume.bodyType === "HEALTHY" ? "건강미" : resume.bodyType}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle>지역</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                {REGIONS[resume.region]?.label || resume.region}
              </Badge>
              {(resume.districts || []).map((district) => (
                <Badge key={district} variant="outline">
                  {district}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Desired Jobs */}
        {(resume.desiredJobs || []).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>희망 업종</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(resume.desiredJobs || []).map((job: BusinessType) => (
                  <Badge key={job} variant="outline">
                    {BUSINESS_TYPES[job]?.label || job}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Experience & Salary */}
        <Card>
          <CardHeader>
            <CardTitle>경력 및 급여</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-24 text-sm font-medium text-muted-foreground">경력</span>
              <span>{experienceLabel}</span>
            </div>
            {salaryInfo && (
              <div className="flex items-center gap-3">
                <span className="w-24 text-sm font-medium text-muted-foreground">희망 급여</span>
                <span>{salaryInfo}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available Hours */}
        {resume.availableHours && (
          <Card>
            <CardHeader>
              <CardTitle>근무 가능 시간</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{resume.availableHours}</p>
            </CardContent>
          </Card>
        )}

        {/* Introduction */}
        <Card>
          <CardHeader>
            <CardTitle>자기소개</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {resume.title && (
              <h3 className="text-base font-bold">{resume.title}</h3>
            )}
            <p className="whitespace-pre-wrap">{resume.introduction}</p>
            {resume.strengths && (
              <div className="border-t pt-3">
                <h4 className="mb-1 text-sm font-medium text-muted-foreground">장점 / 특기</h4>
                <p className="text-sm">{resume.strengths}</p>
              </div>
            )}
            {resume.experience && (
              <div className="border-t pt-3">
                <h4 className="mb-1 text-sm font-medium text-muted-foreground">경력 상세</h4>
                <p className="whitespace-pre-wrap text-sm">{resume.experience}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle>연락처</CardTitle>
          </CardHeader>
          <CardContent>
            {restrictionReason && (
              <div className="mb-4 rounded-md bg-orange-50 p-3 text-sm text-orange-800">
                {restrictionReason}
                {!hasActiveAd && (
                  <Link href="/business/ads/new">
                    <Button size="sm" className="ml-3">광고 등록하기</Button>
                  </Link>
                )}
                {limitExceeded && (
                  <Link href="/business/ads/new">
                    <Button size="sm" variant="outline" className="ml-3">상위 등급 알아보기</Button>
                  </Link>
                )}
              </div>
            )}
            <div className="space-y-3">
              {displayKakao && (
                <div className="flex items-center gap-3">
                  <span className="w-24 text-sm font-medium text-muted-foreground">카카오톡</span>
                  <span className={`text-lg font-medium ${!canViewContact ? "text-muted-foreground" : ""}`}>
                    {displayKakao}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <span className="w-24 text-sm font-medium text-muted-foreground">전화번호</span>
                <span className={`text-lg font-medium ${!canViewContact ? "text-muted-foreground" : ""}`}>
                  {displayPhone}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 text-center">
        <Link href="/business/resumes">
          <Button>목록으로</Button>
        </Link>
      </div>
    </div>
  );
}
