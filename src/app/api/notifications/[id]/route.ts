import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH: Mark single notification as read
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const { id } = await params;

    // Check if notification exists and belongs to user
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return NextResponse.json({ error: "알림을 찾을 수 없습니다" }, { status: 404 });
    }

    if (notification.userId !== session.user.id) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    // Mark as read
    await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return NextResponse.json({ message: "알림을 읽음 처리했습니다" });
  } catch (error) {
    console.error("Mark notification as read error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
