import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/push-notification";
import { checkRateLimit } from "@/lib/rate-limit";

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

    // 2. 파트너 이름 일괄 조회
    const partners = await prisma.user.findMany({
      where: { id: { in: partnerIds } },
      select: { id: true, name: true },
    });
    const partnerMap = new Map(partners.map((p) => [p.id, p.name]));

    // 3. 각 파트너별 최근 메시지 일괄 조회
    const allLastMessages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: { in: partnerIds } },
          { senderId: { in: partnerIds }, receiverId: userId },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    // 파트너별 최신 메시지 매핑
    const lastMessageMap = new Map<string, typeof allLastMessages[0]>();
    for (const msg of allLastMessages) {
      const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      if (!lastMessageMap.has(partnerId)) {
        lastMessageMap.set(partnerId, msg);
      }
    }

    // 4. 안 읽은 수 일괄 조회
    const unreadCounts = await prisma.message.groupBy({
      by: ["senderId"],
      where: {
        senderId: { in: partnerIds },
        receiverId: userId,
        isRead: false,
      },
      _count: { id: true },
    });
    const unreadMap = new Map(unreadCounts.map((u) => [u.senderId, u._count.id]));

    // 5. 결과 조합
    const conversations = partnerIds.map((partnerId) => {
      const lastMessage = lastMessageMap.get(partnerId);
      return {
        partnerId,
        partnerName: partnerMap.get(partnerId) || "알 수 없음",
        lastMessage: lastMessage?.content || "",
        lastMessageAt: lastMessage?.createdAt || new Date(),
        lastMessageSenderId: lastMessage?.senderId || null,
        lastMessageIsRead: lastMessage?.isRead ?? true,
        unreadCount: unreadMap.get(partnerId) || 0,
      };
    });

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

  const { success } = checkRateLimit(`message:${session.user.id}`, 15, 60_000);
  if (!success) {
    return NextResponse.json({ error: "너무 많은 요청입니다. 잠시 후 다시 시도해주세요" }, { status: 429 });
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

    // 보낸 사람 정보 조회 (제재 정보 포함)
    const sender = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        role: true,
        messageBannedUntil: true,
        createdAt: true
      },
    });

    // ADMIN은 모든 제한 우회
    const isAdmin = sender?.role === "ADMIN";

    if (!isAdmin) {
      // 1. 쪽지 정지 체크
      if (sender?.messageBannedUntil) {
        const now = new Date();
        if (sender.messageBannedUntil > now) {
          // 영구 정지 체크 (9999-12-31)
          const isPermanent = sender.messageBannedUntil.getFullYear() === 9999;
          const message = isPermanent
            ? "쪽지 기능이 영구 정지되었습니다"
            : `쪽지 기능이 정지되었습니다 (해제일: ${sender.messageBannedUntil.toISOString().split('T')[0]})`;

          return NextResponse.json(
            { error: message },
            { status: 403 }
          );
        }
      }

      // 2. 신규 회원 체크 (가입 후 24시간)
      if (sender?.createdAt) {
        const accountAge = Date.now() - sender.createdAt.getTime();
        const oneDayMs = 24 * 60 * 60 * 1000;
        if (accountAge < oneDayMs) {
          return NextResponse.json(
            { error: "가입 후 24시간이 지나야 쪽지를 보낼 수 있습니다" },
            { status: 429 }
          );
        }
      }

      // 3. Rate limit 체크
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const recentMessages1Min = await prisma.message.count({
        where: {
          senderId: userId,
          createdAt: { gte: oneMinuteAgo },
        },
      });

      if (recentMessages1Min >= 3) {
        return NextResponse.json(
          { error: "쪽지를 너무 빠르게 보내고 있습니다. 잠시 후 다시 시도해주세요" },
          { status: 429 }
        );
      }

      const recentMessages1Hour = await prisma.message.count({
        where: {
          senderId: userId,
          createdAt: { gte: oneHourAgo },
        },
      });

      if (recentMessages1Hour >= 10) {
        return NextResponse.json(
          { error: "시간당 발송 한도(10건)를 초과했습니다" },
          { status: 429 }
        );
      }

      // 4. 동일 상대 쿨다운 (30초)
      const thirtySecondsAgo = new Date(now.getTime() - 30 * 1000);
      const recentToSameUser = await prisma.message.findFirst({
        where: {
          senderId: userId,
          receiverId,
          createdAt: { gte: thirtySecondsAgo },
        },
      });

      if (recentToSameUser) {
        return NextResponse.json(
          { error: "같은 상대에게 연속 발송은 30초 간격이 필요합니다" },
          { status: 429 }
        );
      }

      // 5. 차단 확인
      const isBlocked = await prisma.messageBlock.findUnique({
        where: {
          blockerId_blockedId: {
            blockerId: receiverId,
            blockedId: userId,
          },
        },
      });

      if (isBlocked) {
        return NextResponse.json(
          { error: "상대방이 쪽지 수신을 거부했습니다" },
          { status: 403 }
        );
      }

      // 6. BUSINESS 역할 유료서비스 체크
      if (sender?.role === "BUSINESS") {
        const PAID_TIERS = ["RECOMMEND", "URGENT", "SPECIAL", "PREMIUM", "VIP", "BANNER"] as const;
        const hasQualifyingAd = await prisma.ad.findFirst({
          where: {
            userId,
            status: "ACTIVE",
            productId: { in: [...PAID_TIERS] },
          },
        });

        if (!hasQualifyingAd) {
          return NextResponse.json(
            { error: "추천광고 이상 이용 회원만 쪽지를 보낼 수 있습니다", code: "BUSINESS_NO_AD" },
            { status: 403 }
          );
        }
      }
    }

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
