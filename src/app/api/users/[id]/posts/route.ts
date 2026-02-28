import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const session = await auth();
    const isAdmin = session?.user?.role === "ADMIN";

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "10", 10) || 10));

    // Build where clause
    const where: Record<string, unknown> = { authorId: userId };

    // Non-admin users can only see non-hidden posts
    if (!isAdmin) {
      where.isHidden = false;
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
          category: true,
          createdAt: true,
          viewCount: true,
          _count: {
            select: { comments: true },
          },
        },
      }),
      prisma.post.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      posts,
      total,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching user posts:", error);
    return NextResponse.json(
      { error: "게시글을 불러오는데 실패했습니다" },
      { status: 500 }
    );
  }
}
