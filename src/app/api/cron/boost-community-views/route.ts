import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCronAuth } from "@/lib/utils/cron-auth";

/**
 * 커뮤니티 조회수 자연 증가 cron - 매 1시간 실행
 * 게시글 나이와 댓글 수에 따른 차등 증가
 */
export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // 최근 7일간 isHidden=false인 게시글 조회
    const posts = await prisma.post.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
        isHidden: false,
      },
      select: {
        id: true,
        createdAt: true,
        _count: {
          select: { comments: true },
        },
      },
    });

    let boosted = 0;
    const now = new Date();

    for (const post of posts) {
      const ageInHours = (now.getTime() - post.createdAt.getTime()) / (1000 * 60 * 60);
      const commentCount = post._count.comments;

      let min: number, max: number;

      // 게시글 나이에 따른 차등 증가
      if (ageInHours <= 24) {
        // 24시간 이내: +3~8
        min = 3;
        max = 8;
      } else if (ageInHours <= 72) {
        // 1~3일: +2~5
        min = 2;
        max = 5;
      } else {
        // 3~7일: +0~3
        min = 0;
        max = 3;
      }

      const baseIncrement = Math.floor(Math.random() * (max - min + 1)) + min;

      // 댓글 수가 많은 글일수록 조회수 부스트가 더 큼 (댓글 수 * 0.5 추가 보너스, 최대 +5)
      const commentBonus = Math.min(Math.floor(commentCount * 0.5), 5);
      const totalIncrement = baseIncrement + commentBonus;

      if (totalIncrement > 0) {
        await prisma.post.update({
          where: { id: post.id },
          data: { viewCount: { increment: totalIncrement } },
        });
        boosted++;
      }
    }

    return NextResponse.json({
      message: "Community view boost completed",
      total: posts.length,
      boosted,
    });
  } catch (error) {
    console.error("Boost community views cron error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
