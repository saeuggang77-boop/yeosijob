import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validators/auth";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
               request.headers.get("x-real-ip") || "unknown";
    const rateLimitResult = checkRateLimit(`reset-password:${ip}`, 5, 60 * 1000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "너무 많은 요청입니다. 잠시 후 다시 시도해주세요." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "입력값을 확인해주세요";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { token, password } = parsed.data;

    // 토큰 조회
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: "유효하지 않은 링크입니다. 다시 요청해주세요." },
        { status: 400 }
      );
    }

    // 만료 확인
    if (resetToken.expires < new Date()) {
      await prisma.passwordResetToken.delete({ where: { token } });
      return NextResponse.json(
        { error: "링크가 만료되었습니다. 다시 요청해주세요." },
        { status: 400 }
      );
    }

    // 비밀번호 변경
    const hashedPassword = await hash(password, 12);
    await prisma.user.update({
      where: { email: resetToken.email },
      data: { hashedPassword },
    });

    // 사용한 토큰 삭제
    await prisma.passwordResetToken.deleteMany({
      where: { email: resetToken.email },
    });

    return NextResponse.json({ message: "비밀번호가 변경되었습니다." });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
