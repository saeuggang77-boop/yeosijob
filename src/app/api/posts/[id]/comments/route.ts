import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { stripHtml } from "@/lib/utils/format";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const comments = await prisma.comment.findMany({
      where: { postId: id },
      orderBy: { createdAt: "desc" },
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

    const commentsWithAuthor = comments.map((comment) => ({
      ...comment,
      authorName: comment.author.name || "익명",
      author: undefined,
    }));

    return NextResponse.json({ comments: commentsWithAuthor });
  } catch (error) {
    console.error("Comments GET error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
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

    const { success } = checkRateLimit(`comment:${session.user.id}`, 10, 60_000);
    if (!success) {
      return NextResponse.json({ error: "너무 많은 요청입니다. 잠시 후 다시 시도해주세요" }, { status: 429 });
    }

    const { id } = await params;
    const body = await request.json();
    const content = stripHtml(body.content || "");

    // Validation
    if (!content || content.length < 1 || content.length > 500) {
      return NextResponse.json({ error: "댓글은 1-500자로 입력해주세요" }, { status: 400 });
    }

    // Check if post exists and get author for notification
    const post = await prisma.post.findUnique({
      where: { id },
      select: { id: true, authorId: true, title: true },
    });

    if (!post) {
      return NextResponse.json({ error: "게시글을 찾을 수 없습니다" }, { status: 404 });
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        authorId: session.user.id,
        postId: id,
      },
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

    // Send notification to post author (skip if commenting on own post)
    if (post.authorId !== session.user.id) {
      const titlePreview = post.title && post.title.length > 20
        ? post.title.slice(0, 20) + "..."
        : post.title || "게시글";
      await prisma.notification.create({
        data: {
          userId: post.authorId,
          title: "새 댓글",
          message: `내 글 '${titlePreview}'에 댓글이 달렸습니다.`,
          link: `/community/${id}`,
        },
      }).catch(() => {}); // Don't fail comment creation if notification fails
    }

    return NextResponse.json(
      {
        ...comment,
        authorName: comment.author.name || "익명",
        author: undefined,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Comment creation error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
