import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { REGIONS } from "@/lib/constants/regions";
import { BUSINESS_TYPES } from "@/lib/constants/business-types";
import { formatDate } from "@/lib/utils/format";
import type { Region } from "@/generated/prisma/client";

export default async function MyScrapsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "JOBSEEKER") {
    redirect("/");
  }

  const scraps = await prisma.scrap.findMany({
    where: { userId: session.user.id },
    include: {
      ad: {
        select: {
          id: true,
          title: true,
          businessName: true,
          salaryText: true,
          regions: true,
          businessType: true,
          createdAt: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-screen-lg px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">찜한 채용공고</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          총 {scraps.length}개의 공고를 찜했습니다
        </p>
      </div>

      {scraps.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="mb-4 text-muted-foreground">
              찜한 채용공고가 없습니다
            </p>
            <Link
              href="/"
              className="text-sm text-primary hover:underline"
            >
              채용공고 둘러보기
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {scraps.map((scrap) => {
            const ad = scrap.ad;
            const regionLabels = ad.regions
              .map((r: Region) => REGIONS[r]?.label || r)
              .join(", ");
            const bizLabel =
              BUSINESS_TYPES[ad.businessType]?.label || ad.businessType;
            const isActive = ad.status === "ACTIVE";

            return (
              <Link
                key={scrap.id}
                href={`/jobs/${ad.id}`}
                className="block"
              >
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-2">
                          <h3 className="font-semibold text-lg">
                            {ad.title}
                          </h3>
                          {!isActive && (
                            <Badge variant="secondary">마감</Badge>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {ad.businessName}
                        </p>
                        <p className="mt-2 font-semibold text-primary">
                          {ad.salaryText}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Badge variant="outline">{regionLabels}</Badge>
                          <Badge variant="outline">{bizLabel}</Badge>
                        </div>
                      </div>
                      <div className="shrink-0 text-xs text-muted-foreground">
                        {formatDate(scrap.createdAt)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* 하단 여백 (모바일 네비) */}
      <div className="h-20 md:hidden" />
    </div>
  );
}
