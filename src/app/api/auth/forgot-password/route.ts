import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { forgotPasswordSchema } from "@/lib/validators/auth";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const rateLimitResult = checkRateLimit(`forgot-password:${ip}`, 3, 60 * 1000); // 3 requests per minute
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "너무 많은 요청입니다. 잠시 후 다시 시도해주세요." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "올바른 이메일을 입력해주세요" },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    // 보안: 이메일 존재 여부와 무관하게 동일 메시지 반환
    const successMessage = "해당 이메일로 비밀번호 재설정 링크를 발송했습니다.";

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, hashedPassword: true },
    });

    // 사용자가 없거나 소셜 전용 계정(비밀번호 없음)이면 조용히 성공 반환
    if (!user || !user.hashedPassword) {
      return NextResponse.json({ message: successMessage });
    }

    // 기존 토큰 삭제
    await prisma.passwordResetToken.deleteMany({
      where: { email },
    });

    // 새 토큰 생성 (1시간 만료)
    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: { email, token, expires },
    });

    // 이메일 발송
    await sendPasswordResetEmail(email, token);

    return NextResponse.json({ message: successMessage });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
