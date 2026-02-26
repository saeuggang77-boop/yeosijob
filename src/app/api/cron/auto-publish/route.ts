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
  generateConversationThread,
} from "@/lib/auto-content/scheduler";
import { createUniqueSlug } from "@/lib/utils/slug";

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

        const slug = await createUniqueSlug(poolItem.title || "자유게시글");

        await prisma.$transaction(async (tx) => {
          // 게시글 생성 (1~25분 전 랜덤 시간으로)
          const createdAt = new Date(Date.now() - (Math.floor(Math.random() * 25) + 1) * 60 * 1000);

          const newPost = await tx.post.create({
            data: {
              authorId: ghost.id,
              title: poolItem.title || "자유게시글",
              slug,
              content: poolItem.content,
              category: poolItem.category || "CHAT",
              viewCount: Math.floor(Math.random() * 2), // 0~1 (새 글이니까 낮게 시작)
              createdAt,
            },
          });

          // ContentPool 사용 표시 + 발행된 게시글 ID 기록
          await tx.contentPool.update({
            where: { id: poolItem.id },
            data: { isUsed: true, publishedPostId: newPost.id },
          });
        });

        published.posts++;
      }
    }

    // === 2. 대화 스레드 발행 (댓글+답글 통합) ===
    const avgComments = Math.round(((config.commentsPerPostMin ?? 2) + (config.commentsPerPostMax ?? 8)) / 2);
    const dailyCommentTarget = getDailyTarget(config.postsPerDay * avgComments, 1);
    const dailyReplyTarget = getDailyTarget(config.postsPerDay * avgComments * config.repliesPerComment, 2);
    const remainingComments = Math.max(0, dailyCommentTarget - todayCounts.comments);
    const remainingReplies = Math.max(0, dailyReplyTarget - todayCounts.replies);
    const totalRemaining = remainingComments + remainingReplies;
    const threadQuota = getSlotQuota(totalRemaining, totalSlots);

    if (threadQuota > 0) {
      // 최근 7일간 고스트 작성 게시글 중 대화가 부족한 것 선택
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const existingPosts = await prisma.post.findMany({
        where: {
          createdAt: { gte: sevenDaysAgo },
          isHidden: false,
          author: { isGhost: true }, // 고스트 작성 게시글만 (글쓴이가 답글해야 하므로)
        },
        select: { id: true, title: true, content: true, authorId: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      });

      // 각 게시글의 총 댓글+답글 수 집계
      const allCommentCounts = await prisma.comment.groupBy({
        by: ["postId"],
        where: {
          author: { isGhost: true },
          postId: { in: existingPosts.map(p => p.id) },
        },
        _count: true,
      });
      const totalCountMap = new Map(allCommentCounts.map(c => [c.postId, c._count]));

      // 댓글이 부족한 게시글 선별
      const needThreads = existingPosts
        .map(post => ({
          ...post,
          current: totalCountMap.get(post.id) || 0,
          target: avgComments + avgComments * config.repliesPerComment,
        }))
        .filter(p => p.current < p.target)
        .sort((a, b) => (b.target - b.current) - (a.target - a.current))
        .slice(0, Math.min(threadQuota, 3)); // 한 번에 최대 3개 게시글

      for (const post of needThreads) {
        try {
          // 한 게시글당 랜덤 메시지 생성 (config 범위 기반)
          const commentsMin = config.commentsPerPostMin ?? 2;
          const commentsMax = config.commentsPerPostMax ?? 8;
          const threadSize = commentsMin + Math.floor(Math.random() * (commentsMax - commentsMin + 1));

          const result = await generateConversationThread(post, threadSize);

          published.comments += result.commentCount;
          published.replies += result.replyCount;

          // 댓글/답글이 생성되면 조회수도 증가 (댓글 1개당 +2~5)
          const totalInteractions = result.commentCount + result.replyCount;
          if (totalInteractions > 0) {
            const viewIncrement = totalInteractions * (Math.floor(Math.random() * 4) + 2); // 각각 +2~5
            await prisma.post.update({
              where: { id: post.id },
              data: { viewCount: { increment: viewIncrement } },
            });
          }
        } catch (error) {
          console.error(`Thread generation failed for post ${post.id}:`, error);
          continue;
        }
      }
    }

    // === 3. 고스트 글쓴이 티키타카 (실제 유저 댓글에 자동 답글) ===
    let tikitakaReplies = 0;
    {
      const threeHoursAgo = new Date();
      threeHoursAgo.setHours(threeHoursAgo.getHours() - 3);

      // 최근 3시간 내 실제 유저가 고스트 게시글에 단 댓글 찾기
      const realUserComments = await prisma.comment.findMany({
        where: {
          createdAt: { gte: threeHoursAgo },
          author: { isGhost: false },
          parentId: null,
          post: {
            author: { isGhost: true },
            isHidden: false,
          },
        },
        select: {
          id: true,
          content: true,
          postId: true,
          post: {
            select: {
              id: true,
              title: true,
              content: true,
              authorId: true,
              author: {
                select: { ghostPersonality: true },
              },
            },
          },
        },
        orderBy: { createdAt: "asc" },
        take: 10,
      });

      const repliedPostIds = new Set<string>();

      for (const comment of realUserComments) {
        if (tikitakaReplies >= 3) break; // 한 cron당 최대 3개
        if (repliedPostIds.has(comment.postId)) continue; // 게시글당 1개

        // 이미 글쓴이가 답글 달았는지 확인
        const existingReply = await prisma.comment.findFirst({
          where: {
            parentId: comment.id,
            authorId: comment.post.authorId,
          },
        });

        if (!existingReply) {
          try {
            const personality = comment.post.author.ghostPersonality || undefined;
            const replies = await generateContextualReplies(
              comment.post.title,
              comment.content,
              1,
              personality
            );

            if (replies.length > 0) {
              await prisma.comment.create({
                data: {
                  authorId: comment.post.authorId,
                  postId: comment.postId,
                  content: replies[0],
                  parentId: comment.id,
                },
              });
              tikitakaReplies++;
              repliedPostIds.add(comment.postId);

              // 답글이 생성되면 조회수도 증가 (+2~5)
              const viewIncrement = Math.floor(Math.random() * 4) + 2;
              await prisma.post.update({
                where: { id: comment.postId },
                data: { viewCount: { increment: viewIncrement } },
              });
            }
          } catch (error) {
            console.error(`Tikitaka reply failed for comment ${comment.id}:`, error);
            continue;
          }
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

              // 댓글이 생성되면 조회수도 증가 (+2~5)
              const viewIncrement = Math.floor(Math.random() * 4) + 2;
              await prisma.post.update({
                where: { id: post.id },
                data: { viewCount: { increment: viewIncrement } },
              });
            } catch (error) {
              console.error(`Real post comment generation failed for post ${post.id}:`, error);
              continue;
            }
          }
        }
      }
    }

    // === 5. 랜덤 좋아요 부여 (고스트 유저 → 고스트 게시글) ===
    let randomLikes = { posts: 0, comments: 0 };
    {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // 최근 7일 고스트 게시글 중 좋아요가 적은 것
      const recentGhostPosts = await prisma.post.findMany({
        where: {
          createdAt: { gte: sevenDaysAgo },
          isHidden: false,
          author: { isGhost: true },
        },
        select: {
          id: true,
          _count: { select: { likes: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 30,
      });

      // 좋아요가 3개 미만인 게시글 선별 (최대 5개)
      const lowLikePosts = recentGhostPosts
        .filter(p => p._count.likes < 3)
        .sort(() => Math.random() - 0.5)
        .slice(0, 5);

      for (const post of lowLikePosts) {
        const likeCount = Math.floor(Math.random() * 4); // 0~3개
        if (likeCount === 0) continue;

        const likers = await getRandomGhostUsers(likeCount);
        for (const liker of likers) {
          try {
            await prisma.postLike.create({
              data: { userId: liker.id, postId: post.id },
            });
            randomLikes.posts++;
          } catch {
            // unique constraint 위반 = 이미 좋아요 → skip
          }
        }

        // 해당 게시글의 댓글 중 랜덤 1~3개에 좋아요
        const comments = await prisma.comment.findMany({
          where: { postId: post.id },
          select: { id: true },
          take: 10,
        });

        if (comments.length > 0) {
          const commentCount = Math.min(Math.floor(Math.random() * 3) + 1, comments.length);
          const shuffledComments = comments.sort(() => Math.random() - 0.5).slice(0, commentCount);

          for (const comment of shuffledComments) {
            const commentLikeCount = Math.floor(Math.random() * 3); // 0~2개
            if (commentLikeCount === 0) continue;

            const commentLikers = await getRandomGhostUsers(commentLikeCount);
            for (const liker of commentLikers) {
              try {
                await prisma.commentLike.create({
                  data: { userId: liker.id, commentId: comment.id },
                });
                randomLikes.comments++;
              } catch {
                // unique constraint 위반 → skip
              }
            }
          }
        }
      }
    }

    return NextResponse.json({
      message: "Auto-publish completed",
      published,
      tikitakaReplies,
      realPostReplies,
      randomLikes,
      kstHour,
      config: {
        enabled: config.enabled,
        activeHours: `${config.activeStartHour}:00 ~ ${config.activeEndHour}:00`,
        postsPerDay: config.postsPerDay,
        commentsPerPost: `${config.commentsPerPostMin ?? 2}~${config.commentsPerPostMax ?? 8}`,
        repliesPerComment: config.repliesPerComment,
      },
      todayCounts,
    });
  } catch (error) {
    console.error("Auto-publish cron error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
