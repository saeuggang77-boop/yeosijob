import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Return notifications list (latest 50) + unread count
export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const userId = session.user.id;

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error("Get notifications error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

// PATCH: Mark all as read
export async function PATCH() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    await prisma.notification.updateMany({
      where: { userId: session.user.id, isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({ message: "모든 알림을 읽음 처리했습니다" });
  } catch (error) {
    console.error("Mark all as read error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
