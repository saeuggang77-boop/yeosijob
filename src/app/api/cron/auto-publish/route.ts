import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCronAuth } from "@/lib/utils/cron-auth";
import {
  isWithinActiveHours,
  getActiveHoursCount,
  getSlotQuota,
  getDailyTarget,
  getContentTarget,
  getRandomGhostUsers,
  getUnusedContent,
  getTodayGhostCounts,
  generateContextualComments,
  generateContextualReplies,
} from "@/lib/auto-content/scheduler";

/**
 * 자동 콘텐츠 발행 cron - 매 30분 실행
 * 활성 시간대(14:00~04:00 KST): 고스트 계정으로 게시글/댓글/답글 자동 생성
 */
export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    // KST 시간 계산 (UTC+9)
    const kstHour = (now.getUTCHours() + 9) % 24;

    // AutoContentConfig 조회 (singleton)
    const config = await prisma.autoContentConfig.findUnique({
      where: { id: "singleton" },
    });

    if (!config || !config.enabled) {
      return NextResponse.json({
        message: "Auto-publish disabled",
        kstHour,
      });
    }

    // 활성 시간대 체크
    if (!isWithinActiveHours(kstHour, config.activeStartHour, config.activeEndHour)) {
      return NextResponse.json({
        message: "Outside active hours",
        kstHour,
        activeStartHour: config.activeStartHour,
        activeEndHour: config.activeEndHour,
      });
    }

    // 오늘 생성된 고스트 콘텐츠 수 조회
    const todayCounts = await getTodayGhostCounts();

    // 활성 시간 수 계산 (자정 넘어가는 경우 고려)
    const activeHoursCount = getActiveHoursCount(
      config.activeStartHour,
      config.activeEndHour
    );

    // 30분 = 2 슬롯/시간 → 총 슬롯 수 = activeHoursCount * 2
    const totalSlots = activeHoursCount * 2;

    const published = {
      posts: 0,
      comments: 0,
      replies: 0,
    };

    let realPostReplies = 0;

    // === 1. 게시글 발행 ===
    const remainingPosts = Math.max(0, getDailyTarget(config.postsPerDay, 0) - todayCounts.posts);
    const postQuota = getSlotQuota(remainingPosts, totalSlots);

    if (postQuota > 0) {
      const ghostUsers = await getRandomGhostUsers(postQuota);
      const postContents = await getUnusedContent("POST", postQuota);

      for (let i = 0; i < Math.min(ghostUsers.length, postContents.length); i++) {
        const ghost = ghostUsers[i];
        const poolItem = postContents[i];

        await prisma.$transaction(async (tx) => {
          // 게시글 생성
          await tx.post.create({
            data: {
              authorId: ghost.id,
              title: poolItem.title || "자유게시글",
              content: poolItem.content,
              category: poolItem.category || "CHAT",
              viewCount: Math.floor(Math.random() * 451) + 50, // 50~500
            },
          });

          // ContentPool 사용 표시
          await tx.contentPool.update({
            where: { id: poolItem.id },
            data: { isUsed: true },
          });
        });

        published.posts++;
      }
    }

    // === 2. 댓글 발행 (게시글당 편중 분배) ===
    const dailyCommentTarget = getDailyTarget(config.postsPerDay * config.commentsPerPost, 1);
    const remainingComments = Math.max(0, dailyCommentTarget - todayCounts.comments);
    const commentQuota = getSlotQuota(remainingComments, totalSlots);

    if (commentQuota > 0) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const existingPosts = await prisma.post.findMany({
        where: {
          createdAt: { gte: sevenDaysAgo },
          isHidden: false,
        },
        select: { id: true, title: true, content: true },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      // 각 게시글의 고스트 댓글 수 집계
      const commentCounts = await prisma.comment.groupBy({
        by: ["postId"],
        where: {
          author: { isGhost: true },
          parentId: null,
          postId: { in: existingPosts.map(p => p.id) },
        },
        _count: true,
      });
      const countMap = new Map(commentCounts.map(c => [c.postId, c._count]));

      // 편중 분배: 게시글별 목표 vs 현재 → 부족한 글만 선별
      const needComments = existingPosts
        .map(post => ({
          ...post,
          current: countMap.get(post.id) || 0,
          target: getContentTarget(post.id, config.commentsPerPost),
        }))
        .filter(p => p.target > p.current)
        .sort((a, b) => (b.target - b.current) - (a.target - a.current))
        .slice(0, commentQuota);

      const ghostUsers = await getRandomGhostUsers(needComments.length);

      for (let i = 0; i < Math.min(needComments.length, ghostUsers.length); i++) {
        const post = needComments[i];
        const ghost = ghostUsers[i];

        try {
          const comments = await generateContextualComments(post.title, post.content, 1);
          if (comments.length === 0) continue;

          await prisma.comment.create({
            data: {
              authorId: ghost.id,
              postId: post.id,
              content: comments[0],
              parentId: null,
            },
          });

          published.comments++;
        } catch (error) {
          console.error(`Comment generation failed for post ${post.id}:`, error);
          continue;
        }
      }
    }

    // === 3. 답글 발행 (댓글당 편중 분배) ===
    const dailyReplyTarget = getDailyTarget(config.postsPerDay * config.commentsPerPost * config.repliesPerComment, 2);
    const remainingReplies = Math.max(0, dailyReplyTarget - todayCounts.replies);
    const replyQuota = getSlotQuota(remainingReplies, totalSlots);

    if (replyQuota > 0) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const existingComments = await prisma.comment.findMany({
        where: {
          createdAt: { gte: sevenDaysAgo },
          parentId: null,
        },
        select: {
          id: true,
          postId: true,
          content: true,
          author: { select: { name: true } },
          post: { select: { title: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      // 각 댓글의 고스트 답글 수 집계
      const replyCounts = await prisma.comment.groupBy({
        by: ["parentId"],
        where: {
          author: { isGhost: true },
          parentId: { in: existingComments.map(c => c.id) },
        },
        _count: true,
      });
      const replyCountMap = new Map(replyCounts.map(r => [r.parentId, r._count]));

      // 편중 분배: 댓글별 목표 vs 현재 → 부족한 댓글만 선별
      const needReplies = existingComments
        .map(comment => ({
          ...comment,
          current: replyCountMap.get(comment.id) || 0,
          target: getContentTarget(comment.id, config.repliesPerComment),
        }))
        .filter(c => c.target > c.current)
        .sort((a, b) => (b.target - b.current) - (a.target - a.current))
        .slice(0, replyQuota);

      const ghostUsers = await getRandomGhostUsers(needReplies.length);

      for (let i = 0; i < Math.min(needReplies.length, ghostUsers.length); i++) {
        const parentComment = needReplies[i];
        const ghost = ghostUsers[i];
        const authorName = parentComment.author.name || "익명";

        try {
          const replies = await generateContextualReplies(
            parentComment.post.title,
            parentComment.content,
            1
          );
          if (replies.length === 0) continue;

          await prisma.comment.create({
            data: {
              authorId: ghost.id,
              postId: parentComment.postId,
              content: `@${authorName} ${replies[0]}`,
              parentId: parentComment.id,
            },
          });

          published.replies++;
        } catch (error) {
          console.error(`Reply generation failed for comment ${parentComment.id}:`, error);
          continue;
        }
      }
    }

    // === 4. 실제 사용자 게시글에 자동 댓글 (realPostAutoReply) ===
    if (config.realPostAutoReply) {
      const sixtyMinutesAgo = new Date();
      sixtyMinutesAgo.setMinutes(sixtyMinutesAgo.getMinutes() - 60);

      // 최근 60분 내 비고스트 사용자가 작성한 게시글 중 고스트 댓글이 없는 것
      const recentRealPosts = await prisma.post.findMany({
        where: {
          createdAt: { gte: sixtyMinutesAgo },
          author: { isGhost: false },
          isHidden: false,
        },
        select: { id: true, title: true, content: true },
        take: 10,
        orderBy: { createdAt: "desc" },
      });

      for (const post of recentRealPosts) {
        // 이 게시글에 고스트 댓글이 있는지 체크
        const ghostCommentCount = await prisma.comment.count({
          where: {
            postId: post.id,
            author: { isGhost: true },
          },
        });

        if (ghostCommentCount === 0) {
          // 1~3개 댓글 추가
          const numComments = Math.floor(Math.random() * 3) + 1;
          const ghostUsers = await getRandomGhostUsers(numComments);

          for (let i = 0; i < ghostUsers.length; i++) {
            const ghost = ghostUsers[i];

            try {
              // AI로 실시간 댓글 생성
              const comments = await generateContextualComments(post.title, post.content, 1);
              if (comments.length === 0) continue;

              // 약간의 시간 오프셋 (자연스러운 간격)
              const offsetMinutes = Math.floor(Math.random() * 30) + 1;
              const createdAt = new Date(now.getTime() + offsetMinutes * 60 * 1000);

              await prisma.comment.create({
                data: {
                  authorId: ghost.id,
                  postId: post.id,
                  content: comments[0],
                  parentId: null,
                  createdAt,
                },
              });

              realPostReplies++;
            } catch (error) {
              console.error(`Real post comment generation failed for post ${post.id}:`, error);
              continue;
            }
          }
        }
      }
    }

    return NextResponse.json({
      message: "Auto-publish completed",
      published,
      realPostReplies,
      kstHour,
      config: {
        enabled: config.enabled,
        activeHours: `${config.activeStartHour}:00 ~ ${config.activeEndHour}:00`,
        postsPerDay: config.postsPerDay,
        commentsPerPost: config.commentsPerPost,
        repliesPerComment: config.repliesPerComment,
      },
      todayCounts,
    });
  } catch (error) {
    console.error("Auto-publish cron error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
