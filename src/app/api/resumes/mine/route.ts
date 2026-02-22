import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    const resume = await prisma.resume.findUnique({
      where: { userId: session.user.id },
    });

    if (!resume) {
      return NextResponse.json({ resume: null });
    }

    // Calculate computed fields
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Check if can bump today (lastBumpedAt is null or was before today)
    let canBumpToday = true;
    if (resume.lastBumpedAt) {
      const lastBumpDate = new Date(
        resume.lastBumpedAt.getFullYear(),
        resume.lastBumpedAt.getMonth(),
        resume.lastBumpedAt.getDate()
      );
      canBumpToday = lastBumpDate.getTime() < today.getTime();
    }

    return NextResponse.json({
      resume: {
        ...resume,
        canBumpToday,
      }
    });
  } catch (error) {
    console.error("My resume error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    const resume = await prisma.resume.findUnique({
      where: { userId: session.user.id },
    });

    if (!resume) {
      return NextResponse.json({ error: "이력서가 없습니다" }, { status: 404 });
    }

    await prisma.resume.delete({
      where: { userId: session.user.id },
    });

    return NextResponse.json({ message: "이력서가 삭제되었습니다" });
  } catch (error) {
    console.error("Resume delete error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
