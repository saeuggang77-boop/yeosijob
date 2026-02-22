import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    if (session.user.role !== "JOBSEEKER") {
      return NextResponse.json(
        { error: "구직자만 스크랩할 수 있습니다" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { adId } = body;

    if (!adId) {
      return NextResponse.json(
        { error: "채용 공고 ID가 필요합니다" },
        { status: 400 }
      );
    }

    // Check if ad exists
    const ad = await prisma.ad.findUnique({
      where: { id: adId },
    });

    if (!ad) {
      return NextResponse.json(
        { error: "존재하지 않는 채용 공고입니다" },
        { status: 404 }
      );
    }

    // Toggle scrap
    const existingScrap = await prisma.scrap.findUnique({
      where: {
        userId_adId: {
          userId: session.user.id,
          adId,
        },
      },
    });

    if (existingScrap) {
      // Remove scrap
      await prisma.scrap.delete({
        where: { id: existingScrap.id },
      });
      return NextResponse.json({ scraped: false });
    } else {
      // Add scrap
      await prisma.scrap.create({
        data: {
          userId: session.user.id,
          adId,
        },
      });
      return NextResponse.json({ scraped: true });
    }
  } catch (error) {
    console.error("Scrap toggle error:", error);
    return NextResponse.json(
      { error: "스크랩 처리 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    if (session.user.role !== "JOBSEEKER") {
      return NextResponse.json(
        { error: "구직자만 스크랩을 조회할 수 있습니다" },
        { status: 403 }
      );
    }

    const scraps = await prisma.scrap.findMany({
      where: { userId: session.user.id },
      include: {
        ad: {
          select: {
            id: true,
            title: true,
            businessName: true,
            salaryText: true,
            regions: true,
            businessType: true,
            createdAt: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(scraps);
  } catch (error) {
    console.error("Scrap list error:", error);
    return NextResponse.json(
      { error: "스크랩 목록 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
