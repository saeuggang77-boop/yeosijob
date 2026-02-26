import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/messages/[userId] - 특정 상대와의 메시지 목록
export async function GET(
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
    // 페이지네이션
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    // 해당 상대와의 메시지 전체 조회
    const [messages, total, partner] = await Promise.all([
      prisma.message.findMany({
        where: {
          OR: [
            { senderId: myId, receiverId: partnerId },
            { senderId: partnerId, receiverId: myId },
          ],
        },
        orderBy: { createdAt: "asc" },
        skip,
        take: limit,
      }),
      prisma.message.count({
        where: {
          OR: [
            { senderId: myId, receiverId: partnerId },
            { senderId: partnerId, receiverId: myId },
          ],
        },
      }),
      prisma.user.findUnique({
        where: { id: partnerId },
        select: { id: true, name: true },
      }),
    ]);

    if (!partner) {
      return NextResponse.json(
        { error: "존재하지 않는 사용자입니다" },
        { status: 404 }
      );
    }

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      messages,
      partner,
      total,
      totalPages,
    });
  } catch (error) {
    console.error("GET /api/messages/[userId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
