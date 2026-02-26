import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // ADMIN, JOBSEEKER는 항상 가능
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, messageBannedUntil: true },
  });

  if (!user) {
    return NextResponse.json({ canSend: false, reason: "USER_NOT_FOUND" });
  }

  if (user.role === "ADMIN" || user.role === "JOBSEEKER") {
    return NextResponse.json({ canSend: true });
  }

  // 정지 상태 체크
  if (user.messageBannedUntil && user.messageBannedUntil > new Date()) {
    const isPermanent = user.messageBannedUntil.getFullYear() === 9999;
    return NextResponse.json({
      canSend: false,
      reason: "BANNED",
      message: isPermanent
        ? "쪽지 기능이 영구 정지되었습니다"
        : `쪽지 기능이 정지되었습니다 (해제일: ${user.messageBannedUntil.toISOString().split("T")[0]})`,
    });
  }

  // BUSINESS: 활성 추천광고 이상 보유 체크
  if (user.role === "BUSINESS") {
    const PAID_TIERS: string[] = ["RECOMMEND", "URGENT", "SPECIAL", "PREMIUM", "VIP", "BANNER"];
    const hasQualifyingAd = await prisma.ad.findFirst({
      where: {
        userId,
        status: "ACTIVE",
        productId: { in: PAID_TIERS as any },
      },
    });

    if (!hasQualifyingAd) {
      return NextResponse.json({
        canSend: false,
        reason: "BUSINESS_NO_AD",
        message: "추천광고 이상 이용 회원만 쪽지를 보낼 수 있습니다",
      });
    }
  }

  return NextResponse.json({ canSend: true });
}
