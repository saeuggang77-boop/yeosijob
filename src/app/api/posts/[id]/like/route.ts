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
    }

    const likeCount = await prisma.postLike.count({ where: { postId: id } });

    return NextResponse.json({ liked: !existing, likeCount });
  } catch (error) {
    console.error("Post like error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
