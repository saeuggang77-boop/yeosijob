import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserNotifPrefs } from "@/lib/notification-helpers";

const VALID_REACTIONS = ["LIKE", "FUNNY", "EMPATHY", "SURPRISE", "ANGRY", "CHEER"] as const;
type ReactionType = typeof VALID_REACTIONS[number];

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    // Get all reactions for this post
    const likes = await prisma.postLike.findMany({
      where: { postId: id },
      select: { reactionType: true, userId: true },
    });

    // Count reactions by type
    const reactions: Record<string, number> = {};
    likes.forEach((like) => {
      const type = like.reactionType || "LIKE";
      reactions[type] = (reactions[type] || 0) + 1;
    });

    // Get current user's reaction
    let userReaction: string | null = null;
    if (session?.user?.id) {
      const userLike = likes.find((l) => l.userId === session.user.id);
      userReaction = userLike?.reactionType || null;
    }

    return NextResponse.json({ reactions, userReaction });
  } catch (error) {
    console.error("Get reactions error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { reactionType } = body;

    // Validate reaction type
    if (reactionType && !VALID_REACTIONS.includes(reactionType)) {
      return NextResponse.json({ error: "유효하지 않은 반응입니다" }, { status: 400 });
    }

    const existing = await prisma.postLike.findUnique({
      where: { userId_postId: { userId: session.user.id, postId: id } },
    });

    let userReaction: string | null = null;

    if (existing) {
      // Same reaction = toggle (delete)
      if (existing.reactionType === reactionType) {
        await prisma.postLike.delete({ where: { id: existing.id } });
        userReaction = null;
      } else {
        // Different reaction = update
        await prisma.postLike.update({
          where: { id: existing.id },
          data: { reactionType: reactionType || "LIKE" },
        });
        userReaction = reactionType || "LIKE";
      }
    } else {
      // Create new reaction
      try {
        await prisma.postLike.create({
          data: {
            userId: session.user.id,
            postId: id,
            reactionType: reactionType || "LIKE",
          },
        });
        userReaction = reactionType || "LIKE";

        // 게시글 작성자에게 알림 (본인 제외)
        const post = await prisma.post.findUnique({
          where: { id },
          select: { authorId: true, title: true },
        });
        if (post && post.authorId !== session.user.id) {
          const prefs = await getUserNotifPrefs(post.authorId);
          if (prefs.notifyLike) {
            await prisma.notification.create({
              data: {
                userId: post.authorId,
                title: "좋아요",
                message: `${session.user.name || "누군가"}님이 "${post.title}" 게시글에 반응했습니다`,
                link: `/community/${id}`,
              },
            }).catch(() => {});
          }
        }
      } catch (error: any) {
        if (error?.code === "P2002") {
          // Race condition: already exists, update instead
          const retry = await prisma.postLike.findUnique({
            where: { userId_postId: { userId: session.user.id, postId: id } },
          });
          if (retry) {
            if (retry.reactionType === reactionType) {
              await prisma.postLike.delete({ where: { id: retry.id } });
              userReaction = null;
            } else {
              await prisma.postLike.update({
                where: { id: retry.id },
                data: { reactionType: reactionType || "LIKE" },
              });
              userReaction = reactionType || "LIKE";
            }
          }
        } else {
          throw error;
        }
      }
    }

    // Get updated reaction counts
    const likes = await prisma.postLike.findMany({
      where: { postId: id },
      select: { reactionType: true },
    });

    const reactions: Record<string, number> = {};
    likes.forEach((like) => {
      const type = like.reactionType || "LIKE";
      reactions[type] = (reactions[type] || 0) + 1;
    });

    return NextResponse.json({ reactions, userReaction });
  } catch (error) {
    console.error("Post like error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
