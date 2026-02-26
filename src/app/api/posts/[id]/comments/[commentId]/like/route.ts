import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const { id, commentId } = await params;

    const existing = await prisma.commentLike.findUnique({
      where: { userId_commentId: { userId: session.user.id, commentId } },
    });

    if (existing) {
      await prisma.commentLike.delete({ where: { id: existing.id } });
    } else {
      await prisma.commentLike.create({
        data: { userId: session.user.id, commentId },
      });

      // 댓글 작성자에게 좋아요 알림 (본인 제외)
      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        select: { authorId: true, postId: true },
      });
      if (comment && comment.authorId !== session.user.id) {
        await prisma.notification.create({
          data: {
            userId: comment.authorId,
            title: "좋아요",
            message: `${session.user.name || "누군가"}님이 회원님의 댓글에 좋아요를 눌렀습니다`,
            link: `/community/${comment.postId}`,
          },
        }).catch(() => {});
      }
    }

    const likeCount = await prisma.commentLike.count({ where: { commentId } });

    return NextResponse.json({ liked: !existing, likeCount });
  } catch (error) {
    console.error("Comment like error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
