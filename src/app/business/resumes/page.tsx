import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { REGIONS } from "@/lib/constants/regions";
import { BUSINESS_TYPES } from "@/lib/constants/business-types";
import { EXPERIENCE_LEVELS, SALARY_TYPES } from "@/lib/constants/resume";
import { AD_PRODUCTS } from "@/lib/constants/products";
import { ResumeFilter } from "@/components/resumes/ResumeFilter";
import { timeAgo, formatPrice } from "@/lib/utils/format";
import type { Region, BusinessType } from "@/generated/prisma/client";

interface PageProps {
  searchParams: Promise<{
    region?: string;
    businessType?: string;
    experience?: string;
    ageRange?: string;
    page?: string;
  }>;
}

export default async function ResumesPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session || (session.user.role !== "BUSINESS" && session.user.role !== "ADMIN")) redirect("/login");

  const isAdmin = session.user.role === "ADMIN";

  // Fetch active ads to determine tier (exclude FREE) - skip for admin
  const activeAds = isAdmin ? [] : await prisma.ad.findMany({
    where: { userId: session.user.id, status: "ACTIVE", productId: { not: "FREE" } },
    select: { id: true, productId: true },
  });

  // Determine best product tier
  let bestProductId = "";
  let dailyLimit = 0;
  let isUnlimited = isAdmin; // Admin always has unlimited access

  if (!isAdmin && activeAds.length > 0) {
    bestProductId = activeAds.reduce((best, ad) => {
      const currentRank = AD_PRODUCTS[ad.productId]?.rank ?? 999;
      const bestRank = AD_PRODUCTS[best]?.rank ?? 999;
      return currentRank < bestRank ? ad.productId : best;
    }, activeAds[0].productId);
    dailyLimit = AD_PRODUCTS[bestProductId]?.resumeViewLimit ?? 3;
    isUnlimited = dailyLimit >= 9999;
  }

  // Count today's views (use $queryRaw with explicit KST midnight to avoid PrismaPg date issues)
  let viewedTodayCount = 0;
  if (!isAdmin && activeAds.length > 0) {
    const now = new Date();
    const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const kstMidnightUTC = new Date(
      Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate()) - 9 * 60 * 60 * 1000
    );
    const cutoff = kstMidnightUTC.toISOString();

    const viewedToday = await prisma.$queryRaw<{ cnt: number }[]>`
      SELECT COUNT(DISTINCT "resumeId")::int AS cnt
      FROM resume_view_logs
      WHERE "userId" = ${session.user.id}
        AND "viewedAt" >= ${cutoff}::timestamptz
    `;
    viewedTodayCount = viewedToday[0]?.cnt ?? 0;
  }

  const params = await searchParams;
  const region = params.region as Region | undefined;
  const businessType = params.businessType as BusinessType | undefined;
  const experience = params.experience;
  const ageRange = params.ageRange;
  const page = parseInt(params.page || "1", 10);
  const limit = 20;

  // Build where clause
  const where: any = {
    isPublic: true,
  };

  if (region) where.region = region;
  if (businessType) where.desiredJobs = { has: businessType };

  if (experience === "BEGINNER") {
    where.experienceLevel = "BEGINNER";
  } else if (experience === "EXPERIENCED") {
    where.experienceLevel = { in: ["UNDER_6M", "6M_TO_1Y", "1Y_TO_3Y", "OVER_3Y"] };
  }

  if (ageRange === "20") {
    where.age = { gte: 20, lte: 29 };
  } else if (ageRange === "30") {
    where.age = { gte: 30, lte: 39 };
  } else if (ageRange === "40") {
    where.age = { gte: 40 };
  }

  const [resumes, total] = await Promise.all([
    prisma.resume.findMany({
      where,
      orderBy: [
        { lastBumpedAt: { sort: "desc", nulls: "last" } },
        { updatedAt: "desc" },
      ],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.resume.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6">
      <h1 className="text-2xl font-bold">인재 정보</h1>

      {/* View quota display */}
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted-foreground">{total}건의 이력서</span>
        {isAdmin ? (
          <Badge variant="default">관리자 · 무제한 열람</Badge>
        ) : activeAds.length === 0 ? (
          <Badge variant="destructive">광고 등록 후 열람 가능</Badge>
        ) : isUnlimited ? (
          <Badge variant="default">
            {AD_PRODUCTS[bestProductId]?.name} · 무제한 열람
          </Badge>
        ) : (
          <Badge variant={viewedTodayCount >= dailyLimit ? "destructive" : "secondary"}>
            오늘 {viewedTodayCount}/{dailyLimit}건 열람
            {viewedTodayCount >= dailyLimit && " (한도 초과)"}
          </Badge>
        )}
      </div>

      {!isAdmin && activeAds.length === 0 && (
        <Card className="mt-4 border-orange-200 bg-orange-50">
          <CardContent className="py-4">
            <p className="text-sm font-medium text-orange-800">
              유료 광고 등록 후 인재정보를 열람할 수 있습니다
            </p>
            <Link href="/business/ads/new">
              <Button size="sm" className="mt-2">광고 등록하기</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="mt-4">
        <ResumeFilter />
      </div>

      <div className="mt-6 space-y-3">
        {resumes.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">
            등록된 이력서가 없습니다
          </p>
        ) : (
          resumes.map((resume) => {
            const experienceLabel = EXPERIENCE_LEVELS.find(
              (e) => e.value === resume.experienceLevel
            )?.label || resume.experienceLevel;

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

            const physicalInfo =
              resume.height && resume.weight
                ? `${resume.height}cm/${resume.weight}kg`
                : resume.height
                ? `${resume.height}cm`
                : resume.weight
                ? `${resume.weight}kg`
                : "";

            return (
              <Link key={resume.id} href={`/business/resumes/${resume.id}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="py-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-base font-bold">
                          {resume.title || "제목 없음"}
                        </h3>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {timeAgo(resume.updatedAt)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">{resume.nickname}</span>
                        <span className="text-muted-foreground">{resume.age}세</span>
                        {physicalInfo && (
                          <span className="text-muted-foreground">{physicalInfo}</span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant="secondary">
                          {REGIONS[resume.region]?.label || resume.region}
                        </Badge>
                        {(resume.districts || []).map((district) => (
                          <Badge key={district} variant="outline">
                            {district}
                          </Badge>
                        ))}
                      </div>

                      {(resume.desiredJobs || []).length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {(resume.desiredJobs || []).map((job: BusinessType) => (
                            <Badge key={job} variant="outline" className="text-xs">
                              {BUSINESS_TYPES[job]?.label || job}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <span className="text-muted-foreground">{experienceLabel}</span>
                        {salaryInfo && (
                          <>
                            <span className="text-muted-foreground">·</span>
                            <span className="text-muted-foreground">{salaryInfo}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/business/resumes?${new URLSearchParams({
                ...(region && { region }),
                ...(businessType && { businessType }),
                ...(experience && { experience }),
                ...(ageRange && { ageRange }),
                page: String(page - 1),
              }).toString()}`}
            >
              <Button variant="outline" size="sm">
                이전
              </Button>
            </Link>
          )}
          <span className="flex items-center px-4 text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/business/resumes?${new URLSearchParams({
                ...(region && { region }),
                ...(businessType && { businessType }),
                ...(experience && { experience }),
                ...(ageRange && { ageRange }),
                page: String(page + 1),
              }).toString()}`}
            >
              <Button variant="outline" size="sm">
                다음
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
