import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCronAuth } from "@/lib/utils/cron-auth";
import { RESUME_EXPIRY_WARNING_DAYS } from "@/lib/constants/resume";

export async function GET(request: NextRequest) {
  // Verify cron authorization
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const warningDate = new Date(now.getTime() + RESUME_EXPIRY_WARNING_DAYS * 24 * 60 * 60 * 1000);

  // Step 1: Expire resumes
  const expireResult = await prisma.resume.updateMany({
    where: {
      isPublic: true,
      expiresAt: {
        not: null,
        lt: now,
      },
    },
    data: {
      isPublic: false,
    },
  });

  // Step 2: Pre-expiry notifications
  const expiringResumes = await prisma.resume.findMany({
    where: {
      isPublic: true,
      expiresAt: {
        not: null,
        gte: now,
        lte: warningDate,
      },
    },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
    },
  });

  let notificationCount = 0;
  const threeDaysAgo = new Date(now.getTime() - RESUME_EXPIRY_WARNING_DAYS * 24 * 60 * 60 * 1000);

  for (const resume of expiringResumes) {
    // Check if notification already exists
    const existingNotification = await prisma.notification.findFirst({
      where: {
        userId: resume.userId,
        title: "이력서 만료 예정",
        createdAt: {
          gt: threeDaysAgo,
        },
      },
    });

    if (!existingNotification) {
      await prisma.notification.create({
        data: {
          userId: resume.userId,
          title: "이력서 만료 예정",
          message: "이력서가 곧 만료됩니다. 갱신하시면 30일 연장됩니다.",
          link: "/my-resume",
        },
      });
      notificationCount++;
    }
  }

  return NextResponse.json({
    expired: expireResult.count,
    notified: notificationCount,
  });
}
