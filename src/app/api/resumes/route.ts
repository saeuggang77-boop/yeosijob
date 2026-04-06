import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resumeSchema } from "@/lib/validators/resume";
import { notifyNewResume, ageToRange } from "@/lib/telegram";
import { REGIONS } from "@/lib/constants/regions";
import { BUSINESS_TYPES } from "@/lib/constants/business-types";
import { EXPERIENCE_LEVELS, SALARY_TYPES } from "@/lib/constants/resume";
import { formatPrice } from "@/lib/utils/format";

import type { Region, BusinessType } from "@/generated/prisma/client";


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
        bodyType: data.bodyType || undefined,
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
        strengths: data.strengths || undefined,
        experience: data.experience || undefined,
        photoUrl: data.photoUrl,
        isPublic: data.isPublic,
        lastBumpedAt: now,
      },
      update: {
        nickname: data.nickname,
        gender: data.gender,
        age: data.age,
        bodyType: data.bodyType || undefined,
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
        strengths: data.strengths || undefined,
        experience: data.experience || undefined,
        photoUrl: data.photoUrl,
        isPublic: data.isPublic,
        // Don't update lastBumpedAt on regular updates
      },
    });

    // Notify ad owners when a new resume is created
    if (isNew) {
      // includeResumeAlert 상품 (PREMIUM/VIP/BANNER)
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

      const userIds = premiumAds.map((a) => a.userId);

      if (userIds.length > 0) {
        // 이력서 알림을 받겠다고 설정한 사장님만 대상
        const notifyTargets = await prisma.user.findMany({
          where: { id: { in: userIds }, notifyResume: true },
          select: { id: true },
        });
        const targetIds = notifyTargets.map((u) => u.id);

        if (targetIds.length > 0) {
          const message = `새로운 구직자(${data.nickname})가 이력서를 등록했습니다. ${data.region} 지역, ${data.desiredJobs.join(", ")} 희망`;

          await prisma.notification.createMany({
            data: targetIds.map((userId) => ({
              userId,
              title: "새 이력서 등록",
              message,
              link: "/business/resumes",
            })),
          });
        }
      }

      // 텔레그램 공식채널에 새 이력서 알림 포스팅 (비차단, 실패 무시)
      // 노출 정보: 지역(광역시), 업종, 연령대(10년 단위), 경력 카테고리, 희망 급여 형태
      // 개인식별정보(이름/정확한 나이/사진/연락처/상세주소)는 일절 포함하지 않음
      if (data.isPublic && data.desiredJobs.length > 0) {
        const regionLabel = REGIONS[data.region as Region]?.label ?? data.region;
        const businessTypeLabel =
          BUSINESS_TYPES[data.desiredJobs[0] as BusinessType]?.shortLabel ??
          BUSINESS_TYPES[data.desiredJobs[0] as BusinessType]?.label ??
          data.desiredJobs[0];

        const ageRange = ageToRange(data.age);

        const rawExperienceLabel =
          EXPERIENCE_LEVELS.find((e) => e.value === data.experienceLevel)?.label ??
          data.experienceLevel;
        const experienceLabel =
          data.experienceLevel === "BEGINNER" ? "신입" : rawExperienceLabel;

        const salaryTypeLabel =
          SALARY_TYPES.find((s) => s.value === data.desiredSalaryType)?.label ??
          data.desiredSalaryType;
        const salaryInfo =
          data.desiredSalaryType === "NEGOTIABLE" || !data.desiredSalaryAmount
            ? "면접 후 협의"
            : `${salaryTypeLabel} ${formatPrice(data.desiredSalaryAmount)}원~`;

        notifyNewResume({
          resumeId: resume.id,
          regionLabel,
          businessTypeLabel,
          ageRange,
          experienceLabel,
          salaryInfo,
        }).catch((err) => {
          console.error("[telegram] notifyNewResume 실패:", err);
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
