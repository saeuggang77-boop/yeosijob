import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCronAuth } from "@/lib/utils/cron-auth";

/**
 * 만료된 본인인증 토큰 정리 cron - 매일 실행
 */
export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await prisma.ageVerification.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    return NextResponse.json({
      message: "Cleanup age tokens completed",
      deleted: result.count,
    });
  } catch (error) {
    console.error("Cleanup age tokens cron error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
