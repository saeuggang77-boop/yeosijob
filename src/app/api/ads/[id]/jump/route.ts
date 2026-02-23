import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "BUSINESS") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    const { id } = await params;

    const ad = await prisma.ad.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        status: true,
        productId: true,
        manualJumpPerDay: true,
        manualJumpUsedToday: true,
        lastManualJumpAt: true,
      },
    });

    if (!ad) {
      return NextResponse.json({ error: "광고를 찾을 수 없습니다" }, { status: 404 });
    }

    if (ad.userId !== session.user.id) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    if (ad.status !== "ACTIVE") {
      return NextResponse.json({ error: "게재중인 광고만 점프할 수 있습니다" }, { status: 400 });
    }

    if (ad.productId === "FREE") {
      return NextResponse.json({ error: "무료 광고는 수동점프를 사용할 수 없습니다. 유료 등급으로 업그레이드해주세요." }, { status: 400 });
    }

    if (ad.manualJumpPerDay === 0) {
      return NextResponse.json({ error: "수동점프를 지원하지 않는 상품입니다" }, { status: 400 });
    }

    if (ad.manualJumpUsedToday >= ad.manualJumpPerDay) {
      return NextResponse.json({ error: "오늘 수동점프 횟수를 모두 사용했습니다" }, { status: 400 });
    }

    // 30분 쿨다운 체크
    if (ad.lastManualJumpAt) {
      const cooldownEnd = new Date(ad.lastManualJumpAt.getTime() + 30 * 60 * 1000);
      if (new Date() < cooldownEnd) {
        const remainingMs = cooldownEnd.getTime() - Date.now();
        const remainingMin = Math.ceil(remainingMs / 60000);
        return NextResponse.json(
          { error: `쿨다운 중입니다 (${remainingMin}분 후 가능)`, nextAvailable: cooldownEnd.toISOString() },
          { status: 429 }
        );
      }
    }

    const now = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.ad.update({
        where: { id },
        data: {
          lastJumpedAt: now,
          lastManualJumpAt: now,
          manualJumpUsedToday: { increment: 1 },
        },
      });

      await tx.jumpLog.create({
        data: {
          adId: id,
          userId: session.user.id,
          type: "MANUAL",
          jumpedAt: now,
        },
      });
    });

    const remaining = ad.manualJumpPerDay - ad.manualJumpUsedToday - 1;
    const nextAvailable = new Date(now.getTime() + 30 * 60 * 1000);

    return NextResponse.json({
      remaining,
      nextAvailable: nextAvailable.toISOString(),
    });
  } catch (error) {
    console.error("Manual jump error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
