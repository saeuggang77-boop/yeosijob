import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    // Get all active partners
    const partners = await prisma.partner.findMany({
      where: {
        status: "ACTIVE",
        ...(category ? { category: category as any } : {}),
      },
      select: {
        id: true,
        name: true,
        category: true,
        region: true,
        description: true,
        grade: true,
        highlight: true,
        tags: true,
        thumbnailUrl: true,
        contactPhone: true,
        contactKakao: true,
        websiteUrl: true,
        viewCount: true,
        createdAt: true,
      },
    });

    // 모든 유료 업체 동등 노출 - 랜덤 셔플
    const sorted = partners.sort(() => Math.random() - 0.5);

    return NextResponse.json({ partners: sorted });
  } catch (error) {
    console.error("Partners list error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
