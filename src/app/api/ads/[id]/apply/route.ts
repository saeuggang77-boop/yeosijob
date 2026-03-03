import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AD_PRODUCTS } from "@/lib/constants/products";
import { BUSINESS_TYPES } from "@/lib/constants/business-types";
import { REGIONS } from "@/lib/constants/regions";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user || session.user.role !== "JOBSEEKER") {
    return NextResponse.json({ error: "구직자만 지원할 수 있습니다" }, { status: 403 });
  }

  const { id: adId } = await params;

  // 이력서 확인
  const resume = await prisma.resume.findUnique({
    where: { userId: session.user.id },
    select: {
      nickname: true,
      region: true,
      desiredJobs: true,
      experienceLevel: true,
    },
  });

  if (!resume) {
    return NextResponse.json({ error: "이력서를 먼저 등록해주세요" }, { status: 400 });
  }

  // 광고 확인
  const ad = await prisma.ad.findUnique({
    where: { id: adId },
    select: {
      id: true,
      title: true,
      status: true,
      productId: true,
      userId: true,
    },
  });

  if (!ad || ad.status !== "ACTIVE") {
    return NextResponse.json({ error: "존재하지 않거나 마감된 광고입니다" }, { status: 404 });
  }

  // 유료 광고(이력서열람 포함) 여부 확인
  const product = AD_PRODUCTS[ad.productId];
  if (!product?.includeResumeView) {
    return NextResponse.json({ error: "이 광고는 지원 기능을 지원하지 않습니다" }, { status: 400 });
  }

  // 중복 지원 확인
  const existing = await prisma.adApplication.findUnique({
    where: { adId_userId: { adId, userId: session.user.id } },
  });

  if (existing) {
    return NextResponse.json({ error: "이미 지원한 광고입니다" }, { status: 409 });
  }

  // 지원 생성 + 사장 알림
  const regionLabel = REGIONS[resume.region]?.label || resume.region;
  const jobLabels = resume.desiredJobs
    .map((j) => BUSINESS_TYPES[j]?.shortLabel || j)
    .join(", ");

  await prisma.$transaction([
    prisma.adApplication.create({
      data: { adId, userId: session.user.id },
    }),
    prisma.notification.create({
      data: {
        userId: ad.userId,
        title: "📋 새 지원자가 있습니다!",
        message: `${resume.nickname}님이 "${ad.title}"에 지원했습니다. 희망업종: ${jobLabels} · 지역: ${regionLabel}`,
        link: "/business/resumes",
      },
    }),
  ]);

  return NextResponse.json({ success: true });
}
