import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RESUME_EXPIRY_DAYS } from "@/lib/constants/resume";

export async function POST() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "JOBSEEKER") {
      return NextResponse.json({ error: "구직자만 이용할 수 있습니다" }, { status: 401 });
    }

    const resume = await prisma.resume.findUnique({
      where: { userId: session.user.id },
    });

    if (!resume) {
      return NextResponse.json({ error: "이력서가 없습니다" }, { status: 404 });
    }

    const now = new Date();
    const newExpiresAt = new Date(now.getTime() + RESUME_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    // Update expiresAt, lastRefreshedAt, and set isPublic to true
    const updatedResume = await prisma.resume.update({
      where: { userId: session.user.id },
      data: {
        expiresAt: newExpiresAt,
        lastRefreshedAt: now,
        isPublic: true,
      },
    });

    return NextResponse.json({
      message: "이력서가 갱신되었습니다",
      resume: updatedResume,
      expiresAt: newExpiresAt,
    });
  } catch (error) {
    console.error("Resume refresh error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
