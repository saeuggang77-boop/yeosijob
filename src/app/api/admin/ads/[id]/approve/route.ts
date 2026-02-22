import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    const { id } = await params;

    const ad = await prisma.ad.findUnique({ where: { id } });
    if (!ad) {
      return NextResponse.json({ error: "광고를 찾을 수 없습니다" }, { status: 404 });
    }

    if (ad.status !== "PENDING_REVIEW") {
      return NextResponse.json(
        { error: `승인할 수 없는 상태입니다 (${ad.status})` },
        { status: 400 }
      );
    }

    const now = new Date();
    const endDate = new Date(now.getTime() + ad.durationDays * 24 * 60 * 60 * 1000);

    await prisma.ad.update({
      where: { id },
      data: {
        status: "ACTIVE",
        startDate: now,
        endDate,
        lastJumpedAt: now,
      },
    });

    return NextResponse.json({ message: "광고가 승인되었습니다", adId: id });
  } catch (error) {
    console.error("Ad approve error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
