import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    if (existing) {
      await prisma.postLike.delete({ where: { id: existing.id } });
    } else {
      await prisma.postLike.create({
        data: { userId: session.user.id, postId: id },
      });

      // 게시글 작성자에게 좋아요 알림 (본인 제외)
      const post = await prisma.post.findUnique({
        where: { id },
        select: { authorId: true, title: true },
      });
      if (post && post.authorId !== session.user.id) {
        await prisma.notification.create({
          data: {
            userId: post.authorId,
            title: "좋아요",
            message: `${session.user.name || "누군가"}님이 "${post.title}" 게시글에 좋아요를 눌렀습니다`,
            link: `/community/${id}`,
          },
        }).catch(() => {}); // 알림 실패해도 좋아요는 정상 처리
      }
    }

    const likeCount = await prisma.postLike.count({ where: { postId: id } });

    return NextResponse.json({ liked: !existing, likeCount });
  } catch (error) {
    console.error("Post like error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
