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
  if (!session || session.user.role !== "BUSINESS") redirect("/login");

  // Check at least one active ad exists
  const activeAd = await prisma.ad.findFirst({
    where: { userId: session.user.id, status: "ACTIVE" },
    select: { id: true },
  });

  if (!activeAd) {
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
    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
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
      <h1 className="text-2xl font-bold">이력서 열람</h1>
      <p className="mt-1 text-sm text-muted-foreground">{total}건의 이력서</p>

      <div className="mt-6">
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
              <Link key={resume.id} href={`/resumes/${resume.id}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="py-4">
                    <div className="space-y-2">
                      {/* Row 1: Title + Date */}
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-base font-bold">
                          {resume.title || "제목 없음"}
                        </h3>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {timeAgo(resume.updatedAt)}
                        </span>
                      </div>

                      {/* Row 2: Nickname + Age + Physical Info */}
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">{resume.nickname}</span>
                        <span className="text-muted-foreground">{resume.age}세</span>
                        {physicalInfo && (
                          <span className="text-muted-foreground">{physicalInfo}</span>
                        )}
                      </div>

                      {/* Row 3: Region + District Badges */}
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

                      {/* Row 4: Desired Job Badges */}
                      {(resume.desiredJobs || []).length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {(resume.desiredJobs || []).map((job: BusinessType) => (
                            <Badge key={job} variant="outline" className="text-xs">
                              {BUSINESS_TYPES[job]?.label || job}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Row 5: Experience + Salary */}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/resumes?${new URLSearchParams({
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
              href={`/resumes?${new URLSearchParams({
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
