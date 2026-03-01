import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    const { searchParams } = request.nextUrl;
    const type = searchParams.get("type") || "post";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = 20;

    if (type === "post") {
      const [posts, total] = await Promise.all([
        prisma.post.findMany({
          where: { deletedAt: { not: null } },
          orderBy: { deletedAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
          select: {
            id: true,
            title: true,
            content: true,
            createdAt: true,
            deletedAt: true,
            deletedBy: true,
            author: { select: { name: true, email: true } },
          },
        }),
        prisma.post.count({ where: { deletedAt: { not: null } } }),
      ]);

      return NextResponse.json({ posts, total });
    } else {
      const [comments, total] = await Promise.all([
        prisma.comment.findMany({
          where: { deletedAt: { not: null } },
          orderBy: { deletedAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
          select: {
            id: true,
            content: true,
            createdAt: true,
            deletedAt: true,
            deletedBy: true,
            postId: true,
            author: { select: { name: true, email: true } },
          },
        }),
        prisma.comment.count({ where: { deletedAt: { not: null } } }),
      ]);

      return NextResponse.json({ comments, total });
    }
  } catch (error) {
    console.error("Trash GET error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    const body = await request.json();
    const { type, id } = body;

    if (!type || !id) {
      return NextResponse.json({ error: "type과 id가 필요합니다" }, { status: 400 });
    }

    if (type === "post") {
      await prisma.post.update({
        where: { id },
        data: { deletedAt: null, deletedBy: null },
      });
    } else if (type === "comment") {
      await prisma.comment.update({
        where: { id },
        data: { deletedAt: null, deletedBy: null },
      });
    } else {
      return NextResponse.json({ error: "유효하지 않은 type입니다" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Trash restore error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    const body = await request.json();
    const { type, id } = body;

    if (!type || !id) {
      return NextResponse.json({ error: "type과 id가 필요합니다" }, { status: 400 });
    }

    if (type === "post") {
      // Hard delete post (cascade will delete related comments, likes, images, etc.)
      await prisma.post.delete({ where: { id } });
    } else if (type === "comment") {
      // Hard delete comment (cascade will delete replies and likes)
      await prisma.comment.delete({ where: { id } });
    } else {
      return NextResponse.json({ error: "유효하지 않은 type입니다" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Trash permanent delete error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
