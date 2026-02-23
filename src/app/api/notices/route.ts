import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = 20;

    const [notices, total] = await Promise.all([
      prisma.notice.findMany({
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
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
      }),
      prisma.notice.count(),
    ]);

    const noticesWithAuthor = notices.map((notice) => ({
      ...notice,
      authorName: notice.author.name || "관리자",
      author: undefined,
    }));

    return NextResponse.json({
      notices: noticesWithAuthor,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Notices GET error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, isPinned } = body;

    // Validation
    if (!title || title.length < 1 || title.length > 100) {
      return NextResponse.json({ error: "제목은 1-100자로 입력해주세요" }, { status: 400 });
    }

    if (!content || content.length < 1 || content.length > 5000) {
      return NextResponse.json({ error: "내용은 1-5000자로 입력해주세요" }, { status: 400 });
    }

    const notice = await prisma.notice.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        isPinned: isPinned === true,
        authorId: session.user.id,
      },
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

    return NextResponse.json(
      {
        ...notice,
        authorName: notice.author.name || "관리자",
        author: undefined,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Notice creation error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
