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

    // 3. 로그인 회원 + 유효한 쿠키인데 ageVerified 미설정 → 자동 영구 저장
    // (KCP cross-site POST에서 세션 쿠키가 전달되지 않아 callback에서 설정 못한 경우 보완)
    if (session?.user?.id) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { ageVerified: new Date() },
      });
    }

    return NextResponse.json({ verified: true });
  } catch (error) {
    console.error("Age verification status error:", error);
    return NextResponse.json({ verified: false });
  }
}
