import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = 20;

    const session = await auth();
    const isAdmin = session?.user?.role === "ADMIN";

    const category = searchParams.get("category") || "";

    const where: Record<string, unknown> = {};

    // Hide isHidden posts unless admin
    if (!isAdmin) {
      where.isHidden = false;
    }

    // Category filter
    if (category && ["FREE_TALK", "REVIEW", "QUESTION", "INFO"].includes(category)) {
      where.category = category;
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          content: true,
          category: true,
          viewCount: true,
          isHidden: true,
          createdAt: true,
          updatedAt: true,
          author: {
            select: {
              name: true,
            },
          },
          _count: {
            select: {
              comments: true,
            },
          },
        },
      }),
      prisma.post.count({ where }),
    ]);

    const postsWithCounts = posts.map((post) => ({
      ...post,
      authorName: post.author.name || "익명",
      commentCount: post._count.comments,
      author: undefined,
      _count: undefined,
    }));

    return NextResponse.json({
      posts: postsWithCounts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Posts GET error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "JOBSEEKER") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, category } = body;

    // Validation
    if (!title || title.length < 1 || title.length > 50) {
      return NextResponse.json({ error: "제목은 1-50자로 입력해주세요" }, { status: 400 });
    }

    if (!content || content.length < 1 || content.length > 2000) {
      return NextResponse.json({ error: "내용은 1-2000자로 입력해주세요" }, { status: 400 });
    }

    const validCategories = ["FREE_TALK", "REVIEW", "QUESTION", "INFO"];
    const postCategory = validCategories.includes(category) ? category : "FREE_TALK";

    const post = await prisma.post.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        category: postCategory,
        authorId: session.user.id,
      },
      select: {
        id: true,
        title: true,
        content: true,
        category: true,
        viewCount: true,
        isHidden: true,
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
        ...post,
        authorName: post.author.name || "익명",
        author: undefined,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Post creation error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
