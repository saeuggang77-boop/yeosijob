import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripHtml } from "@/lib/utils/format";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const { id, commentId } = await params;
    const body = await request.json();
    const content = stripHtml(body.content || "");

    // Validation
    if (!content || content.length < 1 || content.length > 500) {
      return NextResponse.json({ error: "댓글은 1-500자로 입력해주세요" }, { status: 400 });
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { authorId: true, postId: true },
    });

    if (!comment || comment.postId !== id) {
      return NextResponse.json({ error: "댓글을 찾을 수 없습니다" }, { status: 404 });
    }

    const isAdmin = session.user.role === "ADMIN";
    if (comment.authorId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: { content: content.trim() },
      select: {
        id: true,
        content: true,
        createdAt: true,
        author: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      ...updatedComment,
      authorName: updatedComment.author.name || "익명",
      author: undefined,
    });
  } catch (error) {
    console.error("Comment update error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
