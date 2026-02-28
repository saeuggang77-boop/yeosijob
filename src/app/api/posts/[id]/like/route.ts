import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserNotifPrefs } from "@/lib/notification-helpers";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.postLike.findUnique({
      where: { userId_postId: { userId: session.user.id, postId: id } },
    });

    let liked: boolean;

    if (existing) {
      await prisma.postLike.delete({ where: { id: existing.id } });
      liked = false;
    } else {
      try {
        await prisma.postLike.create({
          data: { userId: session.user.id, postId: id },
        });
        liked = true;
      } catch (error: any) {
        if (error?.code === "P2002") {
          // 레이스 컨디션: 이미 존재하면 삭제로 전환
          await prisma.postLike.delete({
            where: { userId_postId: { userId: session.user.id, postId: id } },
          });
          liked = false;
          const likeCount = await prisma.postLike.count({ where: { postId: id } });
          return NextResponse.json({ liked, likeCount });
        }
        throw error;
      }

      // 게시글 작성자에게 좋아요 알림 (본인 제외)
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
              message: `${session.user.name || "누군가"}님이 "${post.title}" 게시글에 좋아요를 눌렀습니다`,
              link: `/community/${id}`,
            },
          }).catch(() => {});
        }
      }
    }

    const likeCount = await prisma.postLike.count({ where: { postId: id } });

    return NextResponse.json({ liked, likeCount });
  } catch (error) {
    console.error("Post like error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
