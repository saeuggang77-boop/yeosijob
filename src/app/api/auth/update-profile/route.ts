import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateProfileSchema } from "@/lib/validators/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "입력값을 확인해주세요";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { name, phone, businessName } = parsed.data;

    // 전화번호 중복 체크 (빈 문자열이 아닌 경우)
    if (phone) {
      const existingUser = await prisma.user.findUnique({ where: { phone } });
      if (existingUser && existingUser.id !== session.user.id) {
        return NextResponse.json({ error: "이미 사용 중인 전화번호입니다" }, { status: 400 });
      }
    }

    // 업데이트 데이터 구성
    const updateData: Record<string, unknown> = {
      name,
      phone: phone || null,
    };

    // BUSINESS 사용자만 businessName 업데이트
    if (session.user.role === "BUSINESS" && businessName !== undefined) {
      updateData.businessName = businessName;
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    });

    return NextResponse.json({ message: "프로필이 수정되었습니다" });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
