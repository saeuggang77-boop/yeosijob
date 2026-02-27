import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const { id, commentId } = await params;
    const isAdmin = session.user.role === "ADMIN";

    // Only admins can delete comments
    if (!isAdmin) {
      return NextResponse.json({ error: "댓글은 삭제할 수 없습니다. 수정만 가능합니다." }, { status: 403 });
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { authorId: true, postId: true },
    });

    if (!comment || comment.postId !== id) {
      return NextResponse.json({ error: "댓글을 찾을 수 없습니다" }, { status: 404 });
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Comment delete error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
