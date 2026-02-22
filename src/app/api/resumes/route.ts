import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resumeSchema } from "@/lib/validators/resume";
import type { Region, BusinessType } from "@/generated/prisma/client";
import { z } from "zod";

// POST: Create/update my resume (for JOBSEEKER users)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "JOBSEEKER") {
      return NextResponse.json({ error: "구직자만 이력서를 등록할 수 있습니다" }, { status: 401 });
    }

    const body = await request.json();

    // Validate with resumeSchema
    const validationResult = resumeSchema.safeParse(body);
    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors;
      console.error("Resume validation failed:", JSON.stringify(fieldErrors, null, 2));
      return NextResponse.json({
        error: "입력 데이터가 올바르지 않습니다",
        fieldErrors,
      }, { status: 400 });
    }

    const data = validationResult.data;

    // Check if resume exists to determine if this is a new creation
    const existingResume = await prisma.resume.findUnique({
      where: { userId: session.user.id },
    });

    const isNew = !existingResume;
    const now = new Date();

    const resume = await prisma.resume.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        nickname: data.nickname,
        gender: data.gender,
        age: data.age,
        height: data.height,
        weight: data.weight,
        region: data.region as Region,
        districts: data.districts,
        desiredJobs: data.desiredJobs as BusinessType[],
        experienceLevel: data.experienceLevel,
        desiredSalaryType: data.desiredSalaryType,
        desiredSalaryAmount: data.desiredSalaryAmount,
        availableHours: data.availableHours,
        kakaoId: data.kakaoId,
        phone: data.phone,
        title: data.title,
        introduction: data.introduction,
        photoUrl: data.photoUrl,
        isPublic: data.isPublic,
        lastBumpedAt: now,
      },
      update: {
        nickname: data.nickname,
        gender: data.gender,
        age: data.age,
        height: data.height,
        weight: data.weight,
        region: data.region as Region,
        districts: data.districts,
        desiredJobs: data.desiredJobs as BusinessType[],
        experienceLevel: data.experienceLevel,
        desiredSalaryType: data.desiredSalaryType,
        desiredSalaryAmount: data.desiredSalaryAmount,
        availableHours: data.availableHours,
        kakaoId: data.kakaoId,
        phone: data.phone,
        title: data.title,
        introduction: data.introduction,
        photoUrl: data.photoUrl,
        isPublic: data.isPublic,
        // Don't update lastBumpedAt on regular updates
      },
    });

    // Notify PREMIUM/VIP/BANNER ad owners when a new resume is created
    if (isNew) {
      // Find business users with PREMIUM, VIP, or BANNER active ads
      // that match the resume's region and desired jobs
      const premiumAds = await prisma.ad.findMany({
        where: {
          status: "ACTIVE",
          productId: { in: ["PREMIUM", "VIP", "BANNER"] },
          regions: { has: data.region as Region },
          businessType: { in: data.desiredJobs as BusinessType[] },
        },
        select: { userId: true },
        distinct: ["userId"],
      });

      if (premiumAds.length > 0) {
        await prisma.notification.createMany({
          data: premiumAds.map((ad) => ({
            userId: ad.userId,
            title: "새 이력서 등록",
            message: `새로운 구직자(${data.nickname})가 이력서를 등록했습니다. ${data.region} 지역, ${data.desiredJobs.join(", ")} 희망`,
            link: "/resumes",
          })),
        });
      }
    }

    return NextResponse.json({
      message: isNew ? "이력서가 등록되었습니다" : "이력서가 수정되었습니다",
      resume
    });
  } catch (error) {
    console.error("Resume create error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
