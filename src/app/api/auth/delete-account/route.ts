import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    // Rate limiting
    const rateLimitResult = checkRateLimit(`delete-account:${session.user.id}`, 5, 60 * 1000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "너무 많은 요청입니다. 잠시 후 다시 시도해주세요." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { password, confirmation } = body;

    // "회원탈퇴" 확인 문구 검증
    if (confirmation !== "회원탈퇴") {
      return NextResponse.json({ error: "확인 문구를 정확히 입력해주세요" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { hashedPassword: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다" }, { status: 404 });
    }

    // 이메일 가입 계정은 비밀번호 확인
    if (user.hashedPassword) {
      if (!password) {
        return NextResponse.json({ error: "비밀번호를 입력해주세요" }, { status: 400 });
      }
      const isValid = await compare(password, user.hashedPassword);
      if (!isValid) {
        return NextResponse.json({ error: "비밀번호가 올바르지 않습니다" }, { status: 400 });
      }
    }

    const userId = session.user.id;

    // 트랜잭션으로 모든 데이터 삭제
    await prisma.$transaction(async (tx) => {
      // 1. 사용자의 광고 ID 목록 조회
      const userAds = await tx.ad.findMany({
        where: { userId },
        select: { id: true },
      });
      const adIds = userAds.map((a) => a.id);

      if (adIds.length > 0) {
        // 2. 광고 관련 데이터 삭제 (Ad에 연결된 것들 - cascade 안 되는 것들)
        // AdOption, AdDailyMetric, JumpLog은 onDelete: Cascade로 자동 삭제됨
        // Review, Scrap은 Ad 관계에서 cascade이므로 자동 삭제됨
        await tx.review.deleteMany({ where: { adId: { in: adIds } } });
        await tx.scrap.deleteMany({ where: { adId: { in: adIds } } });
      }

      // 3. 사용자 직접 연결 데이터 삭제 (cascade 안 되는 것들)
      await tx.review.deleteMany({ where: { userId } });
      await tx.payment.deleteMany({ where: { userId } });
      await tx.resumeViewLog.deleteMany({ where: { userId } });

      // 4. Ad 삭제 (onDelete: Cascade인 AdOption, AdDailyMetric, JumpLog은 자동 삭제)
      await tx.ad.deleteMany({ where: { userId } });

      // 5. PasswordResetToken 삭제 (email 기반)
      if (user.email) {
        await tx.passwordResetToken.deleteMany({ where: { email: user.email } });
      }

      // 6. User 삭제 (나머지는 onDelete: Cascade로 자동 삭제)
      // Account, Session, Resume, Scrap(User), Post, Comment, Notification, Notice는 자동 삭제
      await tx.user.delete({ where: { id: userId } });
    });

    return NextResponse.json({ message: "계정이 삭제되었습니다" });
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
