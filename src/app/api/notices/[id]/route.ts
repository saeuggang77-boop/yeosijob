import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const notice = await prisma.notice.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        content: true,
        viewCount: true,
        isPinned: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!notice) {
      return NextResponse.json({ error: "공지사항을 찾을 수 없습니다" }, { status: 404 });
    }

    // Increment view count
    await prisma.notice.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return NextResponse.json({
      ...notice,
      authorName: notice.author.name || "관리자",
      viewCount: notice.viewCount + 1,
      author: undefined,
    });
  } catch (error) {
    console.error("Notice GET error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, content, isPinned } = body;

    // Validation
    if (title !== undefined && (title.length < 1 || title.length > 100)) {
      return NextResponse.json({ error: "제목은 1-100자로 입력해주세요" }, { status: 400 });
    }

    if (content !== undefined && (content.length < 1 || content.length > 5000)) {
      return NextResponse.json({ error: "내용은 1-5000자로 입력해주세요" }, { status: 400 });
    }

    const notice = await prisma.notice.findUnique({
      where: { id },
    });

    if (!notice) {
      return NextResponse.json({ error: "공지사항을 찾을 수 없습니다" }, { status: 404 });
    }

    const updateData: { title?: string; content?: string; isPinned?: boolean } = {};
    if (title !== undefined) updateData.title = title.trim();
    if (content !== undefined) updateData.content = content.trim();
    if (isPinned !== undefined) updateData.isPinned = isPinned;

    const updatedNotice = await prisma.notice.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        title: true,
        content: true,
        viewCount: true,
        isPinned: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      ...updatedNotice,
      authorName: updatedNotice.author.name || "관리자",
      author: undefined,
    });
  } catch (error) {
    console.error("Notice update error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    const { id } = await params;

    const notice = await prisma.notice.findUnique({
      where: { id },
    });

    if (!notice) {
      return NextResponse.json({ error: "공지사항을 찾을 수 없습니다" }, { status: 404 });
    }

    await prisma.notice.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notice delete error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
