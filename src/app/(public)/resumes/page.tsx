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

export const revalidate = 60;

export const metadata = {
  title: "인재정보",
  description: "유흥업계 구직자 이력서를 확인하세요. 경력, 희망지역, 희망업종별로 검색 가능합니다.",
  openGraph: {
    title: "인재정보 | 여시잡",
    description: "유흥업계 구직자 이력서를 확인하세요.",
  },
  alternates: {
    canonical: "/resumes",
  },
};

interface PageProps {
  searchParams: Promise<{
    region?: string;
    businessType?: string;
    experience?: string;
    ageRange?: string;
    page?: string;
  }>;
}

export default async function PublicResumesPage({ searchParams }: PageProps) {
  const session = await auth();

  // Business/Admin users redirect to their dedicated resume viewing page
  if (session?.user.role === "BUSINESS" || session?.user.role === "ADMIN") {
    redirect("/business/resumes");
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

  // Build pagination URL helper
  function buildUrl(p: number) {
    const params = new URLSearchParams();
    if (region) params.set("region", region);
    if (businessType) params.set("businessType", businessType);
    if (experience) params.set("experience", experience);
    if (ageRange) params.set("ageRange", ageRange);
    params.set("page", String(p));
    return `/resumes?${params.toString()}`;
  }

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6">
      <h1 className="text-2xl font-bold">인재 정보</h1>
      <p className="mt-1 text-sm text-muted-foreground">총 {total.toLocaleString()}건의 이력서</p>

      {/* Privacy notice */}
      <Card className="mt-4 border-green-500/20 bg-green-500/5">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-500/10 text-green-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-green-400">개인정보 안심 보호</p>
              <p className="mt-1 text-xs text-muted-foreground">
                이력서 상세정보(연락처, 사진 등)는 <strong className="text-foreground">유료 광고를 등록한 인증 사장님만</strong> 열람할 수 있습니다. 닉네임, 지역, 희망업종 등 기본정보만 목록에 공개됩니다.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA for non-logged-in users */}
      {!session && (
        <Card className="mt-3 border-primary/20 bg-primary/5">
          <CardContent className="py-4">
            <p className="text-sm font-medium">
              상세 정보는 로그인 후 확인하실 수 있습니다
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/register">
                <Button size="sm" variant="default">
                  구직자 회원가입
                </Button>
              </Link>
              <Link href="/register/business">
                <Button size="sm" variant="outline">
                  사장님 회원가입
                </Button>
              </Link>
              <Link href="/login">
                <Button size="sm" variant="ghost">
                  로그인
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CTA for jobseekers */}
      {session?.user.role === "JOBSEEKER" && (
        <Card className="mt-3 border-primary/20 bg-primary/5">
          <CardContent className="py-4">
            <p className="text-sm font-medium">
              내 이력서를 등록하고 더 많은 업소에 노출되세요
            </p>
            <Link href="/jobseeker/my-resume">
              <Button size="sm" className="mt-2">
                내 이력서 관리
              </Button>
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

            // For non-logged-in users, show limited info
            const isRestricted = !session;

            return (
              <Card
                key={resume.id}
                className={`transition-shadow ${
                  isRestricted ? "relative overflow-hidden" : "hover:shadow-md"
                }`}
              >
                <CardContent className={`py-4 ${isRestricted ? "blur-sm" : ""}`}>
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

                {isRestricted && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                    <div className="text-center">
                      <p className="text-sm font-medium">로그인 후 열람 가능</p>
                      <Link href="/login">
                        <Button size="sm" className="mt-2">
                          로그인
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {page > 1 && (
            <a href={buildUrl(page - 1)}>
              <Button variant="outline" size="sm">
                이전
              </Button>
            </a>
          )}
          <span className="flex items-center px-4 text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <a href={buildUrl(page + 1)}>
              <Button variant="outline" size="sm">
                다음
              </Button>
            </a>
          )}
        </div>
      )}
    </div>
  );
}
