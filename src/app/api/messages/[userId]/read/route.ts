import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/messages/[userId]/read - 특정 상대의 메시지 모두 읽음 처리
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const myId = session.user.id;
  const { userId: partnerId } = await params;

  try {
    // 해당 상대가 나에게 보낸 메시지 중 isRead=false인 것 모두 업데이트
    const result = await prisma.message.updateMany({
      where: {
        senderId: partnerId,
        receiverId: myId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return NextResponse.json({ updated: result.count });
  } catch (error) {
    console.error("PATCH /api/messages/[userId]/read error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
