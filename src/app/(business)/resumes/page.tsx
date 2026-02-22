import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { REGIONS } from "@/lib/constants/regions";
import { BUSINESS_TYPES } from "@/lib/constants/business-types";
import { ResumeFilter } from "@/components/resumes/ResumeFilter";
import type { Region, BusinessType } from "@/generated/prisma/client";

interface PageProps {
  searchParams: Promise<{
    region?: string;
    businessType?: string;
    page?: string;
  }>;
}

export default async function ResumesPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session || session.user.role !== "BUSINESS") redirect("/login");

  // Check active ad
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
  const page = parseInt(params.page || "1", 10);
  const limit = 20;

  const where: Record<string, unknown> = { isPublic: true };
  if (region) where.region = region;
  if (businessType) {
    where.desiredJobs = { has: businessType };
  }

  const [resumes, total] = await Promise.all([
    prisma.resume.findMany({
      where,
      orderBy: { updatedAt: "desc" },
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
          resumes.map((resume) => (
            <Link key={resume.id} href={`/resumes/${resume.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{resume.nickname}</span>
                        {resume.age && (
                          <span className="text-sm text-muted-foreground">
                            {resume.age}세
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Badge variant="secondary">
                          {REGIONS[resume.region]?.label || resume.region}
                        </Badge>
                        {resume.district && (
                          <Badge variant="outline">{resume.district}</Badge>
                        )}
                      </div>
                      {resume.desiredJobs.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {resume.desiredJobs.map((job: BusinessType) => (
                            <Badge key={job} variant="outline" className="text-xs">
                              {BUSINESS_TYPES[job]?.label || job}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {resume.experience && (
                        <p className="mt-2 text-sm">{resume.experience}</p>
                      )}
                      {resume.introduction && (
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                          {resume.introduction}
                        </p>
                      )}
                    </div>
                    <p className="shrink-0 text-xs text-muted-foreground">
                      {new Date(resume.updatedAt).toLocaleDateString("ko-KR")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
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
