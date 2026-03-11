import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifyCronAuth } from "@/lib/utils/cron-auth";

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    // 1. 만료 처리: endDate 지난 파트너 EXPIRED로 변경
    const expireResult = await prisma.partner.updateMany({
      where: {
        status: "ACTIVE",
        endDate: { lt: now, not: null },
      },
      data: {
        status: "EXPIRED",
      },
    });

    // 2. 3일 자동 시작: ACTIVE + endDate 없음 + startDate가 3일 이전
    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const pendingPartners = await prisma.partner.findMany({
      where: {
        status: "ACTIVE",
        endDate: null,
        startDate: { lt: threeDaysAgo },
      },
      select: { id: true, durationDays: true, startDate: true },
    });

    for (const p of pendingPartners) {
      if (!p.startDate) continue; // 쿼리에서 필터되지만 타입 안전성 보장
      const endDate = new Date(p.startDate);
      endDate.setDate(endDate.getDate() + 3 + p.durationDays);
      await prisma.partner.update({
        where: { id: p.id },
        data: { endDate },
      });
    }

    // 변경사항이 있으면 캐시 무효화
    if (expireResult.count > 0 || pendingPartners.length > 0) {
      revalidatePath("/partner");
    }

    return NextResponse.json({
      message: "Expire-partners completed",
      expired: expireResult.count,
      autoStarted: pendingPartners.length,
    });
  } catch (error) {
    console.error("Expire-partners cron error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
