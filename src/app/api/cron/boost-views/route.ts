import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCronAuth } from "@/lib/utils/cron-auth";

/**
 * 조회수 자연 증가 cron - 매 3시간 실행
 * 등급별 차등 증가로 자연스러운 조회수 생성
 */
export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const ads = await prisma.ad.findMany({
      where: {
        status: "ACTIVE",
      },
      select: {
        id: true,
        productId: true,
      },
    });

    let boosted = 0;

    for (const ad of ads) {
      // 등급별 랜덤 증가량 (rank 높을수록 상위 광고)
      let min: number, max: number;
      switch (ad.productId) {
        case "BANNER":  // 특수배너
        case "VIP":     // 우대
          min = 1; max = 3;
          break;
        case "PREMIUM": // 프리미엄
        case "SPECIAL": // 스페셜
          min = 1; max = 2;
          break;
        case "URGENT":    // 급구
        case "RECOMMEND": // 추천
          min = 0; max = 2;
          break;
        case "LINE": // 줄광고
          min = 0; max = 1;
          break;
        default: // FREE
          min = 0; max = 1;
          break;
      }

      const increment = Math.floor(Math.random() * (max - min + 1)) + min;

      if (increment > 0) {
        await prisma.ad.update({
          where: { id: ad.id },
          data: { viewCount: { increment } },
        });
        boosted++;
      }
    }

    return NextResponse.json({
      message: "View boost completed",
      total: ads.length,
      boosted,
    });
  } catch (error) {
    console.error("Boost views cron error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
