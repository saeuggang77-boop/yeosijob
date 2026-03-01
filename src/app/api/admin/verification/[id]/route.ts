import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST: Admin manages business verification (approve / revoke)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    const { id } = await params;
    const { action } = await request.json(); // "approve" or "revoke"

    if (action === "approve") {
      await prisma.user.update({
        where: { id },
        data: { isVerifiedBiz: true },
      });

      // Update all ACTIVE ads of this user to verified
      await prisma.ad.updateMany({
        where: { userId: id, status: "ACTIVE" },
        data: { isVerified: true },
      });

      return NextResponse.json({ message: "인증 승인 완료" });
    } else if (action === "revoke") {
      await prisma.user.update({
        where: { id },
        data: { isVerifiedBiz: false },
      });

      // Remove verified badge from all ads
      await prisma.ad.updateMany({
        where: { userId: id },
        data: { isVerified: false },
      });

      return NextResponse.json({ message: "인증 취소 완료" });
    } else {
      return NextResponse.json({ error: "잘못된 액션" }, { status: 400 });
    }
  } catch (error) {
    console.error("Admin verification error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
