import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { REGIONS } from "@/lib/constants/regions";
import { BUSINESS_TYPES } from "@/lib/constants/business-types";
import { AD_PRODUCTS } from "@/lib/constants/products";
import { formatPhone } from "@/lib/utils/format";
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

  if (!resume || !resume.isPublic) {
    notFound();
  }

  // Check viewing permission
  const activeAds = await prisma.ad.findMany({
    where: { userId: session.user.id, status: "ACTIVE" },
    select: { productId: true },
  });

  if (activeAds.length === 0) {
    return (
      <div className="mx-auto max-w-screen-xl px-4 py-20 text-center">
        <p className="text-lg font-medium">게재중인 광고가 있어야 이력서를 열람할 수 있습니다</p>
        <Link href="/ads/new">
          <Button className="mt-6">광고 등록하기</Button>
        </Link>
      </div>
    );
  }

  // Find best product (lowest rank = highest tier)
  const bestProductId = activeAds.reduce((best, ad) => {
    const currentRank = AD_PRODUCTS[ad.productId]?.rank ?? 999;
    const bestRank = AD_PRODUCTS[best]?.rank ?? 999;
    return currentRank < bestRank ? ad.productId : best;
  }, activeAds[0].productId);

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
  if (!alreadyViewedToday && viewedResumeIds.length >= dailyLimit) {
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
        },
      })
      .catch(() => {});
  }

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
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground w-20">닉네임</span>
              <span className="font-medium">{resume.nickname}</span>
            </div>
            {resume.age && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground w-20">나이</span>
                <span>{resume.age}세</span>
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
              {resume.district && <Badge variant="outline">{resume.district}</Badge>}
            </div>
          </CardContent>
        </Card>

        {/* Desired Jobs */}
        {resume.desiredJobs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>희망 업종</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {resume.desiredJobs.map((job: BusinessType) => (
                  <Badge key={job} variant="outline">
                    {BUSINESS_TYPES[job]?.label || job}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Experience */}
        {resume.experience && (
          <Card>
            <CardHeader>
              <CardTitle>경력</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{resume.experience}</p>
            </CardContent>
          </Card>
        )}

        {/* Introduction */}
        {resume.introduction && (
          <Card>
            <CardHeader>
              <CardTitle>자기소개</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{resume.introduction}</p>
            </CardContent>
          </Card>
        )}

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle>연락처</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground w-20">전화번호</span>
              <span className="font-medium text-lg">
                {resume.user.phone ? formatPhone(resume.user.phone) : "미등록"}
              </span>
            </div>
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
