import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: 강퇴/정지 회원 목록 조회
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tab = searchParams.get("tab") || "banned";

    if (tab === "banned") {
      // 강퇴 회원 목록
      const bannedUsers = await prisma.bannedUser.findMany({
        orderBy: { bannedAt: "desc" },
        include: {
          admin: {
            select: { name: true },
          },
        },
      });

      return NextResponse.json({ bannedUsers });
    } else if (tab === "suspended") {
      // 활동정지 회원 목록
      const suspendedUsers = await prisma.user.findMany({
        where: { isActive: false },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          suspendedUntil: true,
          suspendReason: true,
          suspensionLogs: {
            take: 1,
            orderBy: { startedAt: "desc" },
          },
        },
        orderBy: { suspendedUntil: "desc" },
      });

      return NextResponse.json({ suspendedUsers });
    }

    return NextResponse.json({ error: "잘못된 탭입니다" }, { status: 400 });
  } catch (error) {
    console.error("Banned users fetch error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

// DELETE: 강퇴 해제
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "ID가 필요합니다" }, { status: 400 });
    }

    const bannedUser = await prisma.bannedUser.findUnique({
      where: { id },
      select: { name: true },
    });

    if (!bannedUser) {
      return NextResponse.json(
        { error: "강퇴 기록을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    await prisma.bannedUser.delete({
      where: { id },
    });

    return NextResponse.json({
      message: `${bannedUser.name}님의 강퇴를 해제했습니다. 재가입이 가능합니다.`,
    });
  } catch (error) {
    console.error("Unban error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
