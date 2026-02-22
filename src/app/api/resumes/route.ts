import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Region, BusinessType } from "@/generated/prisma/client";

// POST: Create/update my resume (for JOBSEEKER users)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "JOBSEEKER") {
      return NextResponse.json({ error: "구직자만 이력서를 등록할 수 있습니다" }, { status: 401 });
    }

    const body = await request.json();
    const { nickname, age, region, district, desiredJobs, experience, introduction, isPublic } = body;

    if (!nickname || !region) {
      return NextResponse.json({ error: "닉네임과 희망 지역은 필수입니다" }, { status: 400 });
    }

    const resume = await prisma.resume.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        nickname,
        age: age ? parseInt(age) : null,
        region: region as Region,
        district: district || null,
        desiredJobs: (desiredJobs || []) as BusinessType[],
        experience: experience || null,
        introduction: introduction || null,
        isPublic: isPublic !== false,
      },
      update: {
        nickname,
        age: age ? parseInt(age) : null,
        region: region as Region,
        district: district || null,
        desiredJobs: (desiredJobs || []) as BusinessType[],
        experience: experience || null,
        introduction: introduction || null,
        isPublic: isPublic !== false,
      },
    });

    // Item 24: Notify PREMIUM/VIP business owners
    const isNew = resume.createdAt.getTime() === resume.updatedAt.getTime();
    if (isNew) {
      // Find business users with PREMIUM or VIP active ads
      const premiumOwners = await prisma.ad.findMany({
        where: {
          status: "ACTIVE",
          productId: { in: ["PREMIUM", "VIP", "BANNER"] },
        },
        select: { userId: true },
        distinct: ["userId"],
      });

      if (premiumOwners.length > 0) {
        await prisma.notification.createMany({
          data: premiumOwners.map((owner) => ({
            userId: owner.userId,
            title: "새 이력서 등록",
            message: `새로운 구직자(${nickname})가 이력서를 등록했습니다. ${region} 지역`,
            link: "/resumes",
          })),
        });
      }
    }

    return NextResponse.json({ message: isNew ? "이력서가 등록되었습니다" : "이력서가 수정되었습니다", resume });
  } catch (error) {
    console.error("Resume create error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
