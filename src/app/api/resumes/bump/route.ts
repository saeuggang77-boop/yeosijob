import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    // Check if already bumped today
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (resume.lastBumpedAt) {
      const lastBumpDate = new Date(
        resume.lastBumpedAt.getFullYear(),
        resume.lastBumpedAt.getMonth(),
        resume.lastBumpedAt.getDate()
      );

      // If lastBumpedAt is today or later, can't bump again
      if (lastBumpDate.getTime() >= today.getTime()) {
        return NextResponse.json({
          error: "오늘은 이미 끌어올리기를 사용했습니다"
        }, { status: 429 });
      }
    }

    // Update lastBumpedAt to now
    const updatedResume = await prisma.resume.update({
      where: { userId: session.user.id },
      data: { lastBumpedAt: now },
    });

    return NextResponse.json({
      message: "이력서가 끌어올려졌습니다",
      resume: updatedResume,
    });
  } catch (error) {
    console.error("Resume bump error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
