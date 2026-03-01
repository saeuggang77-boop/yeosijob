import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
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

    // 자기 자신에 대한 작업 방지
    if (id === session.user.id) {
      return NextResponse.json(
        { error: "자기 자신에 대한 작업은 할 수 없습니다" },
        { status: 403 }
      );
    }

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

      revalidatePath("/community");

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

      revalidatePath("/community");

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
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    const { id } = await params;

    // 자기 자신에 대한 작업 방지
    if (id === session.user.id) {
      return NextResponse.json(
        { error: "자기 자신에 대한 작업은 할 수 없습니다" },
        { status: 403 }
      );
    }

    // 유저 정보 조회
    const user = await prisma.user.findUnique({
      where: { id },
      select: { name: true, email: true, phone: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "유저를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 강퇴 사유 받기
    const body = await request.json().catch(() => ({}));
    const reason = body.reason || "운영 원칙 위배";

    // BannedUser 기록 생성 (트랜잭션 밖에서 먼저 생성)
    await prisma.bannedUser.create({
      data: {
        email: user.email || "",
        phone: user.phone,
        name: user.name || "알 수 없음",
        reason,
        bannedBy: session.user.id,
      },
    });

    // 트랜잭션으로 관련 데이터 삭제 (자기 계정 삭제 로직 참고)
    await prisma.$transaction(async (tx) => {
      // 1. 사용자의 광고 ID 목록 조회
      const userAds = await tx.ad.findMany({
        where: { userId: id },
        select: { id: true },
      });
      const adIds = userAds.map((a) => a.id);

      if (adIds.length > 0) {
        // 2. 광고 관련 데이터 삭제
        await tx.review.deleteMany({ where: { adId: { in: adIds } } });
        await tx.scrap.deleteMany({ where: { adId: { in: adIds } } });
      }

      // 3. 사용자 직접 연결 데이터 삭제 (cascade 안 되는 것들)
      await tx.review.deleteMany({ where: { userId: id } });
      await tx.payment.deleteMany({ where: { userId: id } });
      await tx.resumeViewLog.deleteMany({ where: { userId: id } });

      // 4. Ad 삭제
      await tx.ad.deleteMany({ where: { userId: id } });

      // 5. PasswordResetToken 삭제
      if (user.email) {
        await tx.passwordResetToken.deleteMany({ where: { email: user.email } });
      }

      // 6. User 삭제 (나머지는 cascade로 자동 삭제)
      await tx.user.delete({ where: { id } });
    });

    return NextResponse.json({
      message: `${user.name}님을 강퇴 처리했습니다.`,
    });
  } catch (error) {
    console.error("User delete error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
