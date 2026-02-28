import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import type { Region, BusinessType } from "@/generated/prisma/client";
import { REGIONS } from "@/lib/constants/regions";
import { BUSINESS_TYPES } from "@/lib/constants/business-types";
import { ResumeActions } from "@/components/admin/ResumeActions";
import { SEED_EMAILS } from "@/lib/constants/seed-emails";

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function AdminResumesPage({ searchParams }: PageProps) {
  const { page: pageStr } = await searchParams;
  const page = parseInt(pageStr || "1", 10);
  const limit = 20;

  const [resumes, total, publicCount] = await Promise.all([
    prisma.resume.findMany({
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { email: true } },
      },
    }),
    prisma.resume.count(),
    prisma.resume.count({ where: { isPublic: true } }),
  ]);

  const privateCount = total - publicCount;
  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <h1 className="text-2xl font-bold">이력서 관리</h1>

      <p className="mt-2 text-sm text-muted-foreground">
        전체 {total}건 (공개 {publicCount}건 / 비공개 {privateCount}건)
      </p>

      {/* 이력서 리스트 */}
      <div className="mt-6 space-y-3">
        {resumes.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              등록된 이력서가 없습니다
            </CardContent>
          </Card>
        ) : (
          resumes.map((resume) => {
            const regionLabel = REGIONS[resume.region as Region]?.label || resume.region;
            const businessTypeLabels = resume.desiredJobs.map(
              (bt: BusinessType) => BUSINESS_TYPES[bt]?.shortLabel || bt
            );
            const isSeed = resume.user.email ? SEED_EMAILS.includes(resume.user.email) : false;

            return (
              <Card key={resume.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Link
                          href={`/admin/resumes/${resume.id}`}
                          className="truncate font-medium hover:underline"
                        >
                          {resume.nickname}
                        </Link>
                        <Badge variant={resume.isPublic ? "default" : "destructive"}>
                          {resume.isPublic ? "공개" : "비공개"}
                        </Badge>
                        {isSeed && (
                          <Badge variant="destructive" className="text-[10px]">테스트</Badge>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {resume.age}세 · {regionLabel} · {businessTypeLabels.join(", ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        등록일: {new Date(resume.createdAt).toLocaleDateString("ko-KR")}
                      </p>
                    </div>
                    <ResumeActions resumeId={resume.id} isPublic={resume.isPublic} />
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link key={p} href={`/admin/resumes?page=${p}`}>
              <Badge variant={p === page ? "default" : "outline"}>{p}</Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
