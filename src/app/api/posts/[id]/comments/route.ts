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
      where: { postId: id, parentId: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        content: true,
        createdAt: true,
        authorId: true,
        author: {
          select: {
            name: true,
          },
        },
        replies: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            content: true,
            createdAt: true,
            authorId: true,
            author: {
              select: {
                name: true,
              },
            },
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

    // Role check: only JOBSEEKER and ADMIN can write comments
    if (session.user.role !== "JOBSEEKER" && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "구직자 회원만 댓글을 작성할 수 있습니다" },
        { status: 403 }
      );
    }

    // 활동정지 체크
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isActive: true, suspendReason: true, suspendedUntil: true },
    });
    if (currentUser && !currentUser.isActive) {
      const isFarFuture = currentUser.suspendedUntil && currentUser.suspendedUntil.getFullYear() >= 9999;
      const msg = isFarFuture
        ? `활동이 무기한 정지되었습니다. (사유: ${currentUser.suspendReason || "운영 원칙 위배"})`
        : `활동이 정지되었습니다. (사유: ${currentUser.suspendReason || "운영 원칙 위배"} / 해제일: ${currentUser.suspendedUntil?.toLocaleDateString("ko-KR") || "미정"})`;
      return NextResponse.json({ error: msg }, { status: 403 });
    }

    const { success } = checkRateLimit(`comment:${session.user.id}`, 10, 60_000);
    if (!success) {
      return NextResponse.json({ error: "너무 많은 요청입니다. 잠시 후 다시 시도해주세요" }, { status: 429 });
    }

    const { id } = await params;
    const body = await request.json();
    let content = stripHtml(body.content || "");
    const parentId = body.parentId;

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

    let finalParentId = parentId;
    let notificationUserId = post.authorId;

    // Handle nested replies
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
        select: {
          id: true,
          postId: true,
          parentId: true,
          authorId: true,
          author: { select: { name: true } },
        },
      });

      if (!parentComment || parentComment.postId !== id) {
        return NextResponse.json({ error: "댓글을 찾을 수 없습니다" }, { status: 404 });
      }

      // Flatten to 2 levels: if replying to a reply, use the parent's parentId
      if (parentComment.parentId) {
        finalParentId = parentComment.parentId;
        // Prepend @mention to content
        const mentionName = parentComment.author.name || "익명";
        content = `@${mentionName} ${content}`;
      }

      // Notify the parent comment author
      notificationUserId = parentComment.authorId;
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        authorId: session.user.id,
        postId: id,
        parentId: finalParentId,
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

    // Send notification (skip if commenting on own post/comment)
    if (notificationUserId !== session.user.id) {
      const titlePreview = post.title && post.title.length > 20
        ? post.title.slice(0, 20) + "..."
        : post.title || "게시글";
      const notificationMessage = finalParentId
        ? `내 댓글에 답글이 달렸습니다. (${titlePreview})`
        : `내 글 '${titlePreview}'에 댓글이 달렸습니다.`;

      await prisma.notification.create({
        data: {
          userId: notificationUserId,
          title: finalParentId ? "새 답글" : "새 댓글",
          message: notificationMessage,
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
