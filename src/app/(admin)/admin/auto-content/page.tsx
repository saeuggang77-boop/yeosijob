import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AutoContentManager } from "@/components/admin/AutoContentManager";
import { ContentType, GhostPersonality } from "@/generated/prisma/client";

export default async function AutoContentPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  // Get or create config
  let config = await prisma.autoContentConfig.findUnique({
    where: { id: "singleton" },
  });

  if (!config) {
    config = await prisma.autoContentConfig.create({
      data: { id: "singleton" },
    });
  }

  // Get stats - Number()로 감싸서 bigint → number 변환
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
        parentId: null,
      },
    }),
    prisma.comment.count({
      where: {
        createdAt: { gte: today },
        author: { isGhost: true },
        parentId: { not: null },
      },
    }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold">자동 콘텐츠 관리</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        AI 기반 자동 콘텐츠 생성 시스템 설정 및 모니터링
      </p>

      <div className="mt-6">
        <AutoContentManager
          initialConfig={{
            enabled: config.enabled,
            postsPerDay: config.postsPerDay,
            commentsPerDay: config.commentsPerDay,
            repliesPerDay: config.repliesPerDay,
            activeStartHour: config.activeStartHour,
            activeEndHour: config.activeEndHour,
            realPostAutoReply: config.realPostAutoReply,
          }}
          initialStats={{
            poolStats,
            ghostStats,
            totalGhostUsers,
            todayActivity: {
              posts: todayPosts,
              comments: todayComments,
              replies: todayReplies,
            },
          }}
        />
      </div>
    </div>
  );
}
