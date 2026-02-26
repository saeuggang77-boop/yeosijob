import { NextRequest, NextResponse } from "next/server";
import { compare, hash } from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { changePasswordSchema } from "@/lib/validators/auth";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    // Rate limiting
    const rateLimitResult = checkRateLimit(`change-password:${session.user.id}`, 5, 60 * 1000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "너무 많은 요청입니다. 잠시 후 다시 시도해주세요." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = changePasswordSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "입력값을 확인해주세요";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { currentPassword, newPassword } = parsed.data;

    // 사용자 조회
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { hashedPassword: true },
    });

    if (!user?.hashedPassword) {
      return NextResponse.json(
        { error: "소셜 로그인 계정은 비밀번호를 변경할 수 없습니다" },
        { status: 400 }
      );
    }

    // 현재 비밀번호 확인
    const isValid = await compare(currentPassword, user.hashedPassword);
    if (!isValid) {
      return NextResponse.json({ error: "현재 비밀번호가 올바르지 않습니다" }, { status: 400 });
    }

    // 새 비밀번호 저장
    const hashedPassword = await hash(newPassword, 12);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { hashedPassword },
    });

    return NextResponse.json({ message: "비밀번호가 변경되었습니다" });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
