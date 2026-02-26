import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ContentType, GhostPersonality } from "@/generated/prisma/client";

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    // Content pool stats by type
    const contentTypes: ContentType[] = ["POST", "COMMENT", "REPLY"];
    const poolStats = await Promise.all(
      contentTypes.map(async (type) => {
        const [total, used] = await Promise.all([
          prisma.contentPool.count({ where: { type } }),
          prisma.contentPool.count({ where: { type, isUsed: true } }),
        ]);
        return {
          type,
          total,
          used,
          remaining: total - used,
        };
      })
    );

    // Ghost user stats by personality
    const personalities: GhostPersonality[] = [
      "CHATTY",
      "ADVISOR",
      "QUESTIONER",
      "EMOJI_LOVER",
      "CALM",
      "SASSY",
    ];
    const ghostStats = await Promise.all(
      personalities.map(async (personality) => ({
        personality,
        count: await prisma.user.count({
          where: { isGhost: true, ghostPersonality: personality },
        }),
      }))
    );

    const totalGhostUsers = await prisma.user.count({
      where: { isGhost: true },
    });

    // Today's activity (posts, comments, replies created by ghost users)
    // KST 자정 기준 (UTC+9) - scheduler.ts와 동일한 로직
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstNow = new Date(now.getTime() + kstOffset);
    const today = new Date(
      Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate()) - kstOffset
    );

    const [todayPosts, todayComments, todayReplies] = await Promise.all([
      prisma.post.count({
        where: {
          createdAt: { gte: today },
          author: { isGhost: true },
        },
      }),
      prisma.comment.count({
        where: {
          createdAt: { gte: today },
          author: { isGhost: true },
          parentId: null, // Top-level comments only
        },
      }),
      prisma.comment.count({
        where: {
          createdAt: { gte: today },
          author: { isGhost: true },
          parentId: { not: null }, // Replies only
        },
      }),
    ]);

    return NextResponse.json({
      poolStats,
      ghostStats,
      totalGhostUsers,
      todayActivity: {
        posts: todayPosts,
        comments: todayComments,
        replies: todayReplies,
      },
    });
  } catch (error) {
    console.error("Stats fetch error:", error);
    return NextResponse.json(
      { error: "통계를 불러올 수 없습니다" },
      { status: 500 }
    );
  }
}
