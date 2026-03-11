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
    } else if (tab === "blacklist") {
      // 사업자번호 블랙리스트 목록
      const blacklist = await prisma.businessBlacklist.findMany({
        orderBy: { blockedAt: "desc" },
        include: {
          admin: { select: { name: true } },
        },
      });

      return NextResponse.json({ blacklist });
    }

    return NextResponse.json({ error: "잘못된 탭입니다" }, { status: 400 });
  } catch (error) {
    console.error("Banned users fetch error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

// POST: 사업자번호 블랙리스트 추가
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    const body = await request.json();
    const { businessNumber, reason } = body;

    if (!businessNumber || !reason) {
      return NextResponse.json({ error: "사업자번호와 사유를 입력해주세요" }, { status: 400 });
    }

    const cleaned = businessNumber.replace(/[^0-9]/g, "");
    if (cleaned.length !== 10) {
      return NextResponse.json({ error: "올바른 사업자등록번호(10자리)를 입력해주세요" }, { status: 400 });
    }

    const existing = await prisma.businessBlacklist.findUnique({
      where: { businessNumber: cleaned },
    });
    if (existing) {
      return NextResponse.json({ error: "이미 블랙리스트에 등록된 사업자번호입니다" }, { status: 400 });
    }

    await prisma.businessBlacklist.create({
      data: {
        businessNumber: cleaned,
        reason,
        blockedBy: session.user.id,
      },
    });

    return NextResponse.json({ message: `사업자번호 ${cleaned}이(가) 블랙리스트에 추가되었습니다` });
  } catch (error) {
    console.error("Blacklist add error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

// DELETE: 강퇴 해제 / 블랙리스트 해제
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    const body = await request.json();
    const { id, type } = body;

    if (!id) {
      return NextResponse.json({ error: "ID가 필요합니다" }, { status: 400 });
    }

    // 블랙리스트 해제
    if (type === "blacklist") {
      const entry = await prisma.businessBlacklist.findUnique({
        where: { id },
        select: { businessNumber: true },
      });

      if (!entry) {
        return NextResponse.json({ error: "블랙리스트 기록을 찾을 수 없습니다" }, { status: 404 });
      }

      await prisma.businessBlacklist.delete({ where: { id } });

      return NextResponse.json({
        message: `사업자번호 ${entry.businessNumber}이(가) 블랙리스트에서 해제되었습니다`,
      });
    }

    // 강퇴 해제
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
