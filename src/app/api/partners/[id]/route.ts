import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get partner and increment view count
    const partner = await prisma.partner.update({
      where: { id, status: "ACTIVE" },
      data: {
        viewCount: { increment: 1 },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!partner) {
      return NextResponse.json({ error: "파트너를 찾을 수 없습니다" }, { status: 404 });
    }

    return NextResponse.json({ partner });
  } catch (error) {
    console.error("Partner detail error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
