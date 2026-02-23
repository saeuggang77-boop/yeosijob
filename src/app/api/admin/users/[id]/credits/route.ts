import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: 특정 유저의 무료 광고권 조회
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    const { id } = await params;
    const result = await prisma.$queryRaw<{ freeAdCredits: number }[]>`
      SELECT "freeAdCredits" FROM "users" WHERE id = ${id}
    `;

    return NextResponse.json({
      freeAdCredits: result[0]?.freeAdCredits ?? 0,
    });
  } catch (error) {
    console.error("Get credits error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

// POST: 무료 광고권 부여
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
    const { credits, mode } = await request.json();

    if (mode === "set") {
      // 직접 설정 모드: 0 이상 허용
      if (typeof credits !== "number" || credits < 0 || credits > 100) {
        return NextResponse.json({ error: "0~100 사이의 값을 입력해주세요" }, { status: 400 });
      }

      const result = await prisma.$queryRaw<{ name: string; freeAdCredits: number }[]>`
        UPDATE "users"
        SET "freeAdCredits" = ${credits}
        WHERE id = ${id}
        RETURNING name, "freeAdCredits"
      `;

      const user = result[0];
      return NextResponse.json({
        message: `${user.name}님의 무료 광고권을 ${user.freeAdCredits}회로 변경했습니다.`,
        freeAdCredits: user.freeAdCredits,
      });
    }

    // 추가 모드 (기본)
    if (!credits || credits < 1 || credits > 100) {
      return NextResponse.json({ error: "1~100 사이의 값을 입력해주세요" }, { status: 400 });
    }

    const result = await prisma.$queryRaw<{ name: string; freeAdCredits: number }[]>`
      UPDATE "users"
      SET "freeAdCredits" = "freeAdCredits" + ${credits}
      WHERE id = ${id}
      RETURNING name, "freeAdCredits"
    `;

    const user = result[0];
    return NextResponse.json({
      message: `${user.name}님에게 무료 광고권 ${credits}회 부여 완료 (총 ${user.freeAdCredits}회)`,
      freeAdCredits: user.freeAdCredits,
    });
  } catch (error) {
    console.error("Grant credits error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
