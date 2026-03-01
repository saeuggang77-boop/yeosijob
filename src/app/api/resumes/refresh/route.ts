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

    // updatedAt 갱신
    const updatedResume = await prisma.resume.update({
      where: { userId: session.user.id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      message: "이력서가 갱신되었습니다",
      resume: updatedResume,
    });
  } catch (error) {
    console.error("Resume refresh error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
