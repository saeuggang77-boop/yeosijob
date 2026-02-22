import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { REGIONS } from "@/lib/constants/regions";
import { BUSINESS_TYPES } from "@/lib/constants/business-types";
import { EXPERIENCE_LEVELS, SALARY_TYPES } from "@/lib/constants/resume";
import { formatPhone, formatPrice } from "@/lib/utils/format";
import { ResumeActions } from "@/components/admin/ResumeActions";
import type { BusinessType } from "@/generated/prisma/client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminResumeDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const { id } = await params;

  const resume = await prisma.resume.findUnique({
    where: { id },
    include: {
      user: {
        select: { phone: true, name: true, email: true },
      },
    },
  });

  if (!resume) notFound();

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

  const isExpired = resume.expiresAt && resume.expiresAt < new Date();

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/admin/resumes">
          <Button variant="ghost" size="sm">
            ← 목록으로
          </Button>
        </Link>
        <ResumeActions resumeId={resume.id} isPublic={resume.isPublic} />
      </div>

      {/* Status Badges */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Badge variant={resume.isPublic ? "default" : "destructive"}>
          {resume.isPublic ? "공개" : "비공개"}
        </Badge>
        {isExpired && <Badge variant="destructive">만료됨</Badge>}
        {resume.expiresAt && !isExpired && (
          <Badge variant="outline">
            만료: {new Date(resume.expiresAt).toLocaleDateString("ko-KR")}
          </Badge>
        )}
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

        {/* User Account Info (admin-only) */}
        <Card>
          <CardHeader>
            <CardTitle>회원 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-24 text-sm font-medium text-muted-foreground">
                이름
              </span>
              <span>{resume.user.name || "-"}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-24 text-sm font-medium text-muted-foreground">
                이메일
              </span>
              <span>{resume.user.email || "-"}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-24 text-sm font-medium text-muted-foreground">
                가입 전화
              </span>
              <span>
                {resume.user.phone ? formatPhone(resume.user.phone) : "-"}
              </span>
            </div>
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

        {/* Contact (admin can always view) */}
        <Card>
          <CardHeader>
            <CardTitle>연락처</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {resume.kakaoId && (
              <div className="flex items-center gap-3">
                <span className="w-24 text-sm font-medium text-muted-foreground">
                  카카오톡
                </span>
                <span className="text-lg font-medium">{resume.kakaoId}</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <span className="w-24 text-sm font-medium text-muted-foreground">
                전화번호
              </span>
              <span className="text-lg font-medium">
                {resume.phone
                  ? formatPhone(resume.phone)
                  : resume.user.phone
                  ? formatPhone(resume.user.phone)
                  : "미등록"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Metadata (admin-only) */}
        <Card>
          <CardHeader>
            <CardTitle>시스템 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <span className="w-28 font-medium text-muted-foreground">
                이력서 ID
              </span>
              <span className="font-mono text-xs">{resume.id}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-28 font-medium text-muted-foreground">
                등록일
              </span>
              <span>
                {new Date(resume.createdAt).toLocaleString("ko-KR")}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-28 font-medium text-muted-foreground">
                수정일
              </span>
              <span>
                {new Date(resume.updatedAt).toLocaleString("ko-KR")}
              </span>
            </div>
            {resume.lastBumpedAt && (
              <div className="flex items-center gap-3">
                <span className="w-28 font-medium text-muted-foreground">
                  끌어올리기
                </span>
                <span>
                  {new Date(resume.lastBumpedAt).toLocaleString("ko-KR")}
                </span>
              </div>
            )}
            {resume.lastRefreshedAt && (
              <div className="flex items-center gap-3">
                <span className="w-28 font-medium text-muted-foreground">
                  갱신일
                </span>
                <span>
                  {new Date(resume.lastRefreshedAt).toLocaleString("ko-KR")}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 flex justify-center gap-3">
        <Link href="/admin/resumes">
          <Button>목록으로</Button>
        </Link>
      </div>
    </div>
  );
}
