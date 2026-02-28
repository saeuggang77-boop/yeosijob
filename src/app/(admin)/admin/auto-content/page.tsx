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

  // KST 자정 기준 (UTC+9)
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstNow = new Date(now.getTime() + kstOffset);
  const today = new Date(
    Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate()) - kstOffset
  );

  // 모든 독립 쿼리를 하나의 Promise.all로 병렬 실행 (18개 → 6개 쿼리)
  const [
    poolStatsRaw,
    ghostStatsRaw,
    ghostUsersRaw,
    todayPosts,
    todayComments,
    todayReplies,
  ] = await Promise.all([
    // 1. 콘텐츠 풀 통계 (groupBy 2개 = 쿼리 2개, 기존 6개)
    prisma.contentPool.groupBy({
      by: ["type", "isUsed"],
      _count: true,
    }),
    // 2. 유령회원 성격별 통계 (groupBy 1개, 기존 7개 = 6 count + 1 total)
    prisma.user.groupBy({
      by: ["ghostPersonality"],
      where: { isGhost: true },
      _count: true,
    }),
    // 3. 유령회원 목록 (1개, 동일)
    prisma.user.findMany({
      where: { isGhost: true, isActive: true },
      select: { id: true, name: true, ghostPersonality: true, isActive: true },
      orderBy: { createdAt: "desc" },
    }),
    // 4~6. 오늘 활동 (3개, 동일)
    prisma.post.count({
      where: { createdAt: { gte: today }, author: { isGhost: true } },
    }),
    prisma.comment.count({
      where: { createdAt: { gte: today }, author: { isGhost: true }, parentId: null },
    }),
    prisma.comment.count({
      where: { createdAt: { gte: today }, author: { isGhost: true }, parentId: { not: null } },
    }),
  ]);

  // poolStats 가공: groupBy 결과 → type별 total/used/remaining
  const contentTypes: ContentType[] = ["POST", "COMMENT", "REPLY"];
  const poolStats = contentTypes.map((type) => {
    const rows = poolStatsRaw.filter((r) => r.type === type);
    const total = rows.reduce((sum, r) => sum + r._count, 0);
    const used = rows.filter((r) => r.isUsed).reduce((sum, r) => sum + r._count, 0);
    return { type, total, used, remaining: total - used };
  });

  // ghostStats 가공: groupBy 결과 → personality별 count
  const personalities: GhostPersonality[] = [
    "CHATTY", "ADVISOR", "QUESTIONER", "EMOJI_LOVER", "CALM", "SASSY",
  ];
  const ghostStats = personalities.map((personality) => ({
    personality,
    count: ghostStatsRaw.find((r) => r.ghostPersonality === personality)?._count || 0,
  }));

  const totalGhostUsers = ghostStatsRaw.reduce((sum, r) => sum + r._count, 0);

  const ghostUsers = ghostUsersRaw.map((user) => ({
    id: user.id,
    name: user.name || "Unknown",
    ghostPersonality: user.ghostPersonality,
    isActive: user.isActive,
  }));

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
            commentsPerPost: config.commentsPerPost,
            commentsPerPostMin: config.commentsPerPostMin,
            commentsPerPostMax: config.commentsPerPostMax,
            repliesPerComment: config.repliesPerComment,
            authorReplyRateMin: config.authorReplyRateMin,
            authorReplyRateMax: config.authorReplyRateMax,
            activeStartHour: config.activeStartHour,
            activeEndHour: config.activeEndHour,
            realPostAutoReply: config.realPostAutoReply,
            seoKeywords: config.seoKeywords || [],
            categoryWeights: (config.categoryWeights as Record<string, number>) || { CHAT: 30, BEAUTY: 25, QNA: 25, WORK: 20 },
          }}
          initialStats={{
            poolStats,
            ghostStats,
            totalGhostUsers,
            ghostUsers,
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
