import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/messages/unread-count - 안읽은 쪽지 개수
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const count = await prisma.message.count({
      where: {
        receiverId: userId,
        isRead: false,
      },
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error("GET /api/messages/unread-count error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
