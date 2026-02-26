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

    const { commentId } = await params;

    const existing = await prisma.commentLike.findUnique({
      where: { userId_commentId: { userId: session.user.id, commentId } },
    });

    if (existing) {
      await prisma.commentLike.delete({ where: { id: existing.id } });
    } else {
      await prisma.commentLike.create({
        data: { userId: session.user.id, commentId },
      });
    }

    const likeCount = await prisma.commentLike.count({ where: { commentId } });

    return NextResponse.json({ liked: !existing, likeCount });
  } catch (error) {
    console.error("Comment like error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
