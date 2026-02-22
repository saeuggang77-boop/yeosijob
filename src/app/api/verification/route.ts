import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST: Submit business number for verification
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "BUSINESS") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    const { businessNumber } = await request.json();
    if (!businessNumber || businessNumber.length < 10) {
      return NextResponse.json({ error: "올바른 사업자등록번호를 입력해주세요" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { businessNumber: businessNumber.replace(/-/g, "") },
    });

    return NextResponse.json({ message: "사업자등록번호가 제출되었습니다. 관리자 확인 후 인증 배지가 부여됩니다." });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

// GET: Check verification status
export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { businessNumber: true, isVerifiedBiz: true },
    });

    return NextResponse.json({
      businessNumber: user?.businessNumber || null,
      isVerified: user?.isVerifiedBiz || false,
    });
  } catch (error) {
    console.error("Verification check error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
