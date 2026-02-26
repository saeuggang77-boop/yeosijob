import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/push-notification";

// GET /api/messages - 대화 목록 (상대방별 최신 메시지 그룹)
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    // 1. 내가 보낸 + 받은 메시지에서 상대방 ID 목록 추출
    const sentMessages = await prisma.message.findMany({
      where: { senderId: userId },
      select: { receiverId: true },
      distinct: ["receiverId"],
    });

    const receivedMessages = await prisma.message.findMany({
      where: { receiverId: userId },
      select: { senderId: true },
      distinct: ["senderId"],
    });

    const partnerIds = [
      ...new Set([
        ...sentMessages.map((m) => m.receiverId),
        ...receivedMessages.map((m) => m.senderId),
      ]),
    ];

    // 2. 각 상대방별 최신 메시지 및 안읽은 수 조회
    const conversations = await Promise.all(
      partnerIds.map(async (partnerId) => {
        // 최신 메시지
        const lastMessage = await prisma.message.findFirst({
          where: {
            OR: [
              { senderId: userId, receiverId: partnerId },
              { senderId: partnerId, receiverId: userId },
            ],
          },
          orderBy: { createdAt: "desc" },
        });

        // 안읽은 수 (상대방이 나에게 보낸 것 중)
        const unreadCount = await prisma.message.count({
          where: {
            senderId: partnerId,
            receiverId: userId,
            isRead: false,
          },
        });

        // 상대방 이름
        const partner = await prisma.user.findUnique({
          where: { id: partnerId },
          select: { name: true },
        });

        return {
          partnerId,
          partnerName: partner?.name || "알 수 없음",
          lastMessage: lastMessage?.content || "",
          lastMessageAt: lastMessage?.createdAt || new Date(),
          unreadCount,
        };
      })
    );

    // 정렬: lastMessageAt desc
    conversations.sort(
      (a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime()
    );

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("GET /api/messages error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/messages - 쪽지 보내기
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const body = await req.json();
    const { receiverId, content } = body;

    // 유효성 검사
    if (!receiverId || !content) {
      return NextResponse.json(
        { error: "receiverId와 content는 필수입니다" },
        { status: 400 }
      );
    }

    if (content.length < 1 || content.length > 500) {
      return NextResponse.json(
        { error: "content는 1~500자여야 합니다" },
        { status: 400 }
      );
    }

    if (receiverId === userId) {
      return NextResponse.json(
        { error: "자기자신에게 쪽지를 보낼 수 없습니다" },
        { status: 400 }
      );
    }

    // 상대방 존재 및 활성 상태 확인
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true, name: true, isActive: true },
    });

    if (!receiver) {
      return NextResponse.json(
        { error: "존재하지 않는 사용자입니다" },
        { status: 404 }
      );
    }

    if (!receiver.isActive) {
      return NextResponse.json(
        { error: "비활성화된 사용자에게 쪽지를 보낼 수 없습니다" },
        { status: 400 }
      );
    }

    // 보낸 사람 이름 조회
    const sender = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    // Message 생성
    const message = await prisma.message.create({
      data: {
        senderId: userId,
        receiverId,
        content,
      },
    });

    // Notification 생성
    await prisma.notification.create({
      data: {
        userId: receiverId,
        title: "새 쪽지",
        message: `${sender?.name || "사용자"}님이 쪽지를 보냈습니다`,
        link: `/messages/${userId}`,
      },
    });

    // Push 알림 발송 (fire-and-forget)
    sendPushNotification(receiverId, {
      title: '새 쪽지',
      body: `${sender?.name || "사용자"}님이 쪽지를 보냈습니다`,
      url: `/messages/${userId}`,
    }).catch(() => {}); // 실패해도 메인 흐름에 영향 없음

    return NextResponse.json({ message });
  } catch (error) {
    console.error("POST /api/messages error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
