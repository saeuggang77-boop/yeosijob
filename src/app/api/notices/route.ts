import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/push-notification";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
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

    // Send notification to all active, non-ghost users
    try {
      const activeUsers = await prisma.user.findMany({
        where: {
          isActive: true,
          isGhost: false,
        },
        select: {
          id: true,
        },
      });

      if (activeUsers.length > 0) {
        await prisma.notification.createMany({
          data: activeUsers.map((user) => ({
            userId: user.id,
            title: "새 공지사항",
            message: `새 공지사항: ${notice.title}`,
            link: `/notice/${notice.id}`,
          })),
        });

        // 브라우저 푸시 알림 (fire and forget)
        Promise.allSettled(
          activeUsers.map((user) =>
            sendPushNotification(user.id, {
              title: "새 공지사항",
              body: notice.title,
              url: `/notice/${notice.id}`,
            })
          )
        ).catch(() => {});
      }
    } catch (error) {
      console.error("Failed to create notifications for notice:", error);
      // Don't fail notice creation if notification fails
    }

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
