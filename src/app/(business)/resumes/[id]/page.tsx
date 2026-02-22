import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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

export default async function ResumeDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session || session.user.role !== "BUSINESS") redirect("/login");

  const { id } = await params;

  // Fetch resume with user phone
  const resume = await prisma.resume.findUnique({
    where: { id },
    include: {
      user: {
        select: { phone: true, name: true },
      },
    },
  });

  // Check if resume exists and is public and not expired
  if (
    !resume ||
    !resume.isPublic ||
    (resume.expiresAt && resume.expiresAt < new Date())
  ) {
    notFound();
  }

  // Check active ads
  const activeAds = await prisma.ad.findMany({
    where: { userId: session.user.id, status: "ACTIVE" },
    select: { id: true, productId: true },
  });

  if (activeAds.length === 0) {
    return (
      <div className="mx-auto max-w-screen-xl px-4 py-20 text-center">
        <p className="text-lg font-medium">광고 등록 후 열람 가능합니다</p>
        <p className="mt-1 text-sm text-muted-foreground">
          게재중인 광고가 있어야 이력서를 열람할 수 있습니다
        </p>
        <Link href="/ads/new">
          <Button className="mt-6">광고 등록하기</Button>
        </Link>
      </div>
    );
  }

  // Find best product tier (lowest rank = highest tier)
  const bestProductId = activeAds.reduce((best, ad) => {
    const currentRank = AD_PRODUCTS[ad.productId]?.rank ?? 999;
    const bestRank = AD_PRODUCTS[best]?.rank ?? 999;
    return currentRank < bestRank ? ad.productId : best;
  }, activeAds[0].productId);

  const bestAdId = activeAds.find((ad) => ad.productId === bestProductId)?.id || activeAds[0].id;
  const dailyLimit = AD_PRODUCTS[bestProductId]?.resumeViewLimit ?? 3;

  // Check today's views
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const viewedToday = await prisma.resumeViewLog.findMany({
    where: {
      userId: session.user.id,
      viewedAt: { gte: today },
    },
    select: { resumeId: true },
    distinct: ["resumeId"],
  });

  const viewedResumeIds = viewedToday.map((v) => v.resumeId);
  const alreadyViewedToday = viewedResumeIds.includes(id);

  // Check if limit exceeded
  const limitExceeded = !alreadyViewedToday && viewedResumeIds.length >= dailyLimit;

  if (limitExceeded) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <Card>
          <CardHeader>
            <CardTitle>이력서 열람 한도 초과</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              오늘 이력서 열람 한도({dailyLimit}건)를 초과했습니다
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              상위 등급으로 업그레이드하면 더 많이 열람할 수 있습니다
            </p>
            <p className="mt-4 text-sm">
              현재 등급: <strong>{AD_PRODUCTS[bestProductId]?.name}</strong>
            </p>
            <div className="mt-6 flex gap-3">
              <Link href="/resumes">
                <Button variant="outline">목록으로</Button>
              </Link>
              <Link href="/ads/new">
                <Button>상위 등급 알아보기</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Log view (fire-and-forget)
  if (!alreadyViewedToday) {
    prisma.resumeViewLog
      .create({
        data: {
          userId: session.user.id,
          resumeId: id,
          adId: bestAdId,
        },
      })
      .catch(() => {});
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

  const canViewContact = activeAds.length > 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6">
        <Link href="/resumes">
          <Button variant="ghost" size="sm">
            ← 목록으로
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        {/* Photo */}
        {resume.photoUrl && (
          <Card>
            <CardContent className="py-6">
              <div className="flex justify-center">
                <img
                  src={resume.photoUrl}
                  alt="프로필 사진"
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
              <span className="w-24 text-sm font-medium text-muted-foreground">
                닉네임
              </span>
              <span className="font-medium">{resume.nickname}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-24 text-sm font-medium text-muted-foreground">
                성별
              </span>
              <span>{resume.gender}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-24 text-sm font-medium text-muted-foreground">
                나이
              </span>
              <span>{resume.age}세</span>
            </div>
            {resume.height && (
              <div className="flex items-center gap-3">
                <span className="w-24 text-sm font-medium text-muted-foreground">
                  신장
                </span>
                <span>{resume.height}cm</span>
              </div>
            )}
            {resume.weight && (
              <div className="flex items-center gap-3">
                <span className="w-24 text-sm font-medium text-muted-foreground">
                  체중
                </span>
                <span>{resume.weight}kg</span>
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
              <span className="w-24 text-sm font-medium text-muted-foreground">
                경력
              </span>
              <span>{experienceLabel}</span>
            </div>
            {salaryInfo && (
              <div className="flex items-center gap-3">
                <span className="w-24 text-sm font-medium text-muted-foreground">
                  희망 급여
                </span>
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
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle>연락처</CardTitle>
          </CardHeader>
          <CardContent>
            {canViewContact ? (
              <div className="space-y-3">
                {resume.kakaoId && (
                  <div className="flex items-center gap-3">
                    <span className="w-24 text-sm font-medium text-muted-foreground">
                      카카오톡
                    </span>
                    <span className="font-medium text-lg">{resume.kakaoId}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <span className="w-24 text-sm font-medium text-muted-foreground">
                    전화번호
                  </span>
                  <span className="font-medium text-lg">
                    {resume.phone
                      ? formatPhone(resume.phone)
                      : resume.user.phone
                      ? formatPhone(resume.user.phone)
                      : "미등록"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="rounded-md bg-muted p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  광고 등록 후 연락처를 확인할 수 있습니다
                </p>
                <Link href="/ads/new">
                  <Button className="mt-4" size="sm">
                    광고 등록하기
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 text-center">
        <Link href="/resumes">
          <Button>목록으로</Button>
        </Link>
      </div>
    </div>
  );
}
