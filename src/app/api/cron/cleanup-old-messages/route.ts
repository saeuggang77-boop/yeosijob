import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCronAuth } from "@/lib/utils/cron-auth";

/**
 * 90일 지난 읽은 알림/쪽지 정리 cron - 매일 실행
 * - 읽은(isRead: true) 알림 중 90일 경과 삭제
 * - 읽은(isRead: true) 쪽지 중 90일 경과 삭제
 * - 안 읽은 것은 절대 삭제 안 함
 */
export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 90일 전 날짜 계산
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // 읽은 알림 중 90일 경과한 것 삭제
    const deletedNotifications = await prisma.notification.deleteMany({
      where: {
        isRead: true,
        createdAt: { lt: ninetyDaysAgo },
      },
    });

    // 읽은 쪽지 중 90일 경과한 것 삭제
    const deletedMessages = await prisma.message.deleteMany({
      where: {
        isRead: true,
        createdAt: { lt: ninetyDaysAgo },
      },
    });

    return NextResponse.json({
      message: "Cleanup old messages completed",
      deletedNotifications: deletedNotifications.count,
      deletedMessages: deletedMessages.count,
      total: deletedNotifications.count + deletedMessages.count,
    });
  } catch (error) {
    console.error("Cleanup old messages cron error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
