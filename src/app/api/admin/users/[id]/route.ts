import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH: 등급변경 + 활동정지
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, role, reason, days } = body;

    if (action === "changeRole") {
      // 등급변경 (ADMIN 제외)
      if (!role || !["JOBSEEKER", "BUSINESS"].includes(role)) {
        return NextResponse.json(
          { error: "유효하지 않은 등급입니다" },
          { status: 400 }
        );
      }

      const user = await prisma.user.update({
        where: { id },
        data: { role },
        select: { name: true, role: true },
      });

      return NextResponse.json({
        message: `${user.name}님의 등급을 ${role === "JOBSEEKER" ? "구직자" : "업소사장"}로 변경했습니다.`,
        user,
      });
    }

    if (action === "suspend") {
      // 활동정지 (사유 + 기간)
      const suspendReason = reason || "운영 원칙 위배";
      const suspendDays = typeof days === "number" ? days : 7;

      // 만료일 계산 (0 = 무기한 → 9999-12-31)
      const expiresAt = suspendDays === 0
        ? new Date("9999-12-31T23:59:59Z")
        : new Date(Date.now() + suspendDays * 24 * 60 * 60 * 1000);

      const user = await prisma.user.update({
        where: { id },
        data: {
          isActive: false,
          suspendedUntil: expiresAt,
          suspendReason,
        },
        select: { name: true },
      });

      // 정지 이력 기록
      await prisma.suspensionLog.create({
        data: {
          userId: id,
          adminId: session.user.id,
          reason: suspendReason,
          days: suspendDays,
          expiresAt: suspendDays === 0 ? null : expiresAt,
        },
      });

      // 알림 발송
      const periodText = suspendDays === 0
        ? "무기한"
        : `${suspendDays}일 (해제일: ${expiresAt.toLocaleDateString("ko-KR")})`;

      await prisma.notification.create({
        data: {
          userId: id,
          title: "활동정지 안내",
          message: `활동이 정지되었습니다.\n사유: ${suspendReason}\n기간: ${periodText}`,
        },
      });

      return NextResponse.json({
        message: `${user.name}님을 활동정지 처리했습니다. (${periodText})`,
      });
    }

    if (action === "unsuspend") {
      // 활동정지 해제
      const user = await prisma.user.update({
        where: { id },
        data: {
          isActive: true,
          suspendedUntil: null,
          suspendReason: null,
        },
        select: { name: true },
      });

      // 해제 알림
      await prisma.notification.create({
        data: {
          userId: id,
          title: "활동정지 해제",
          message: "활동정지가 해제되었습니다. 정상적으로 활동하실 수 있습니다.",
        },
      });

      return NextResponse.json({
        message: `${user.name}님의 활동정지를 해제했습니다.`,
      });
    }

    return NextResponse.json(
      { error: "유효하지 않은 액션입니다" },
      { status: 400 }
    );
  } catch (error) {
    console.error("User management error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

// DELETE: 강퇴 (계정 삭제)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    const { id } = await params;

    // 유저 정보 조회
    const user = await prisma.user.findUnique({
      where: { id },
      select: { name: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "유저를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 유저 삭제 (관련 게시글/댓글은 cascade로 자동 삭제)
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({
      message: `${user.name}님을 강퇴 처리했습니다.`,
    });
  } catch (error) {
    console.error("User delete error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
