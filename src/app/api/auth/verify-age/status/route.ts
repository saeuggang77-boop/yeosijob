import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // 1. 로그인 회원이면 User.ageVerified 확인 → 영구 인증
    const session = await auth();
    if (session?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { ageVerified: true },
      });
      if (user?.ageVerified) {
        return NextResponse.json({ verified: true });
      }
    }

    // 2. 비로그인 또는 미인증 회원 → 쿠키 기반 확인 (30일)
    const token = request.cookies.get("age_token")?.value;

    if (!token) {
      return NextResponse.json({ verified: false });
    }

    const verification = await prisma.ageVerification.findUnique({
      where: { token },
    });

    if (!verification) {
      const response = NextResponse.json({ verified: false });
      response.cookies.delete("age_token");
      return response;
    }

    if (verification.expiresAt < new Date()) {
      await prisma.ageVerification.delete({ where: { token } });
      const response = NextResponse.json({ verified: false, expired: true });
      response.cookies.delete("age_token");
      return response;
    }

    return NextResponse.json({ verified: true });
  } catch (error) {
    console.error("Age verification status error:", error);
    return NextResponse.json({ verified: false });
  }
}
