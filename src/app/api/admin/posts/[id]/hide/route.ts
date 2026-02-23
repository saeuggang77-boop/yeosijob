import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    const { id } = await params;

    const post = await prisma.post.findUnique({
      where: { id },
      select: { isHidden: true },
    });

    if (!post) {
      return NextResponse.json({ error: "게시글을 찾을 수 없습니다" }, { status: 404 });
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: { isHidden: !post.isHidden },
      select: {
        id: true,
        isHidden: true,
      },
    });

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error("Post hide toggle error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
