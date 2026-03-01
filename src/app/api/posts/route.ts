import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { stripHtml } from "@/lib/utils/format";
import { createUniqueSlug } from "@/lib/utils/slug";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
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
    if (category && ["CHAT", "BEAUTY", "QNA", "WORK"].includes(category)) {
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
          slug: true,
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
    if (!session || (session.user.role !== "JOBSEEKER" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
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

    const { success } = checkRateLimit(`post:${session.user.id}`, 5, 60_000);
    if (!success) {
      return NextResponse.json({ error: "너무 많은 요청입니다. 잠시 후 다시 시도해주세요" }, { status: 429 });
    }

    const body = await request.json();
    const { title: rawTitle, content: rawContent, category, isAnonymous, imageUrls } = body;
    const title = stripHtml(rawTitle || "");
    const content = stripHtml(rawContent || "");

    // Validation
    if (!title || title.length < 1 || title.length > 50) {
      return NextResponse.json({ error: "제목은 1-50자로 입력해주세요" }, { status: 400 });
    }

    if (!content || content.length < 1 || content.length > 2000) {
      return NextResponse.json({ error: "내용은 1-2000자로 입력해주세요" }, { status: 400 });
    }

    const validCategories = ["CHAT", "BEAUTY", "QNA", "WORK"];
    const postCategory = validCategories.includes(category) ? category : "CHAT";

    // Validate images
    if (imageUrls && Array.isArray(imageUrls) && imageUrls.length > 5) {
      return NextResponse.json({ error: "이미지는 최대 5장까지 첨부할 수 있습니다" }, { status: 400 });
    }

    const slug = await createUniqueSlug(title.trim());

    const post = await prisma.post.create({
      data: {
        title: title.trim(),
        slug,
        content: content.trim(),
        category: postCategory,
        authorId: session.user.id,
        isAnonymous: !!isAnonymous,
        images: imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0
          ? {
              create: imageUrls.map((img: { url: string; blobPath: string; size: number }, idx: number) => ({
                url: img.url,
                blobPath: img.blobPath,
                size: img.size,
                sortOrder: idx,
              })),
            }
          : undefined,
      },
      select: {
        id: true,
        slug: true,
        title: true,
        content: true,
        category: true,
        viewCount: true,
        isHidden: true,
        isAnonymous: true,
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
    // Note: slug is included in the response for redirect
  } catch (error) {
    console.error("Post creation error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
