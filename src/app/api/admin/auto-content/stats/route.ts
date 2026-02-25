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
          total: Number(total),
          used: Number(used),
          remaining: Number(total) - Number(used),
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
        count: Number(await prisma.user.count({
          where: { isGhost: true, ghostPersonality: personality },
        })),
      }))
    );

    const totalGhostUsers = Number(await prisma.user.count({
      where: { isGhost: true },
    }));

    // Today's activity (posts, comments, replies created by ghost users)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

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
        posts: Number(todayPosts),
        comments: Number(todayComments),
        replies: Number(todayReplies),
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
