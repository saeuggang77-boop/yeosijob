import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripHtml } from "@/lib/utils/format";
import { del } from "@vercel/blob";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    const isAdmin = session?.user?.role === "ADMIN";

    const post = await prisma.post.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        content: true,
        category: true,
        isAnonymous: true,
        viewCount: true,
        isHidden: true,
        hiddenAt: true,
        createdAt: true,
        updatedAt: true,
        authorId: true,
        author: {
          select: {
            name: true,
          },
        },
        images: {
          orderBy: { sortOrder: "asc" },
          select: { id: true, url: true },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "게시글을 찾을 수 없습니다" }, { status: 404 });
    }

    // Check if user can view hidden post
    const isAuthor = session?.user?.id === post.authorId;
    if (post.isHidden && !isAdmin && !isAuthor) {
      return NextResponse.json({ error: "접근 권한이 없습니다" }, { status: 403 });
    }

    // Increment view count
    await prisma.post.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    // Calculate cooldown for author/admin
    let cooldownUntil: string | null = null;

    if (session?.user?.id === post.authorId || isAdmin) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentHidden = await prisma.post.findFirst({
        where: {
          authorId: post.authorId,
          hiddenAt: { gte: thirtyDaysAgo },
          id: { not: id },
        },
        select: { hiddenAt: true },
      });

      if (recentHidden && recentHidden.hiddenAt) {
        const end = new Date(recentHidden.hiddenAt);
        end.setDate(end.getDate() + 30);
        cooldownUntil = end.toISOString();
      }
    }

    return NextResponse.json({
      ...post,
      authorName: post.author.name || "익명",
      viewCount: post.viewCount + 1,
      author: undefined,
      cooldownUntil,
      // Keep authorId for permission checks (edit/delete buttons)
    });
  } catch (error) {
    console.error("Post GET error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      title: rawTitle,
      content: rawContent,
      category,
      isAnonymous,
      isHidden,
      deleteImageIds = [],
      newImages = []
    } = body;
    const title = stripHtml(rawTitle || "");
    const content = stripHtml(rawContent || "");

    // Validation
    if (!title || title.length < 1 || title.length > 50) {
      return NextResponse.json({ error: "제목은 1-50자로 입력해주세요" }, { status: 400 });
    }

    if (!content || content.length < 1 || content.length > 2000) {
      return NextResponse.json({ error: "내용은 1-2000자로 입력해주세요" }, { status: 400 });
    }

    // Validate category
    const validCategories = ["CHAT", "BEAUTY", "QNA", "WORK"];
    if (category && !validCategories.includes(category)) {
      return NextResponse.json({ error: "유효하지 않은 카테고리입니다" }, { status: 400 });
    }

    const post = await prisma.post.findUnique({
      where: { id },
      select: {
        authorId: true,
        isHidden: true,
        images: {
          select: { id: true, blobPath: true }
        }
      },
    });

    if (!post) {
      return NextResponse.json({ error: "게시글을 찾을 수 없습니다" }, { status: 404 });
    }

    const isAdmin = session.user.role === "ADMIN";
    if (post.authorId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    // Get blobPaths for images to delete
    const imagesToDelete = post.images.filter((img) =>
      deleteImageIds.includes(img.id)
    );

    // Build update data
    const updateData: any = {
      title: title.trim(),
      content: content.trim(),
    };

    if (category) {
      updateData.category = category;
    }

    // isAnonymous 변경 불가 (작성 시에만 설정, 수정에서 변경 방지)

    // isHidden handling with cooldown check (before transaction)
    if (typeof isHidden === "boolean") {
      if (isHidden && !post.isHidden) {
        // New hide transition → check cooldown
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentHidden = await prisma.post.findFirst({
          where: {
            authorId: session.user.id,
            hiddenAt: { gte: thirtyDaysAgo },
            id: { not: id },
          },
          select: { hiddenAt: true },
        });

        if (recentHidden && recentHidden.hiddenAt) {
          const cooldownEnd = new Date(recentHidden.hiddenAt);
          cooldownEnd.setDate(cooldownEnd.getDate() + 30);
          const formatted = `${cooldownEnd.getFullYear()}년 ${cooldownEnd.getMonth() + 1}월 ${cooldownEnd.getDate()}일`;
          return NextResponse.json(
            { error: `${formatted}까지 비공개 전환이 불가합니다. (30일 쿨다운)` },
            { status: 400 }
          );
        }

        updateData.isHidden = true;
        updateData.hiddenAt = new Date();
      } else if (!isHidden) {
        // Public transition → no cooldown check
        updateData.isHidden = false;
      }
    }

    // Update post in transaction
    const updatedPost = await prisma.$transaction(async (tx) => {
      // Delete images from database
      if (deleteImageIds.length > 0) {
        await tx.postImage.deleteMany({
          where: {
            id: { in: deleteImageIds },
            postId: id,
          },
        });
      }

      // Create new images
      if (newImages.length > 0) {
        const existingImageCount = post.images.length - deleteImageIds.length;
        await tx.postImage.createMany({
          data: newImages.map((img: any, idx: number) => ({
            postId: id,
            url: img.url,
            blobPath: img.blobPath,
            size: img.size,
            sortOrder: existingImageCount + idx,
          })),
        });
      }

      return await tx.post.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          slug: true,
          title: true,
          content: true,
          category: true,
          isAnonymous: true,
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
    });

    // Delete images from Vercel Blob (outside transaction)
    if (imagesToDelete.length > 0) {
      await Promise.allSettled(
        imagesToDelete.map((img) =>
          del(img.blobPath).catch((err) => {
            console.error(`Failed to delete blob ${img.blobPath}:`, err);
          })
        )
      );
    }

    return NextResponse.json({
      ...updatedPost,
      authorName: updatedPost.author.name || "익명",
      author: undefined,
    });
  } catch (error) {
    console.error("Post update error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const { id } = await params;
    const isAdmin = session.user.role === "ADMIN";

    // Only admins can delete posts
    if (!isAdmin) {
      return NextResponse.json({ error: "게시글은 삭제할 수 없습니다. 수정만 가능합니다." }, { status: 403 });
    }

    const post = await prisma.post.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!post) {
      return NextResponse.json({ error: "게시글을 찾을 수 없습니다" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // ContentPool에서 해당 게시글로 발행된 항목의 isUsed 리셋
      await tx.contentPool.updateMany({
        where: { publishedPostId: id },
        data: { isUsed: false, publishedPostId: null },
      });

      await tx.post.delete({
        where: { id },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Post delete error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
