import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    // Get or create singleton config
    let config = await prisma.autoContentConfig.findUnique({
      where: { id: "singleton" },
    });

    if (!config) {
      config = await prisma.autoContentConfig.create({
        data: { id: "singleton" },
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error("Config fetch error:", error);
    return NextResponse.json(
      { error: "설정을 불러올 수 없습니다" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    const body = await request.json();
    const {
      enabled,
      postsPerDay,
      commentsPerPost,
      repliesPerComment,
      activeStartHour,
      activeEndHour,
      realPostAutoReply,
      seoKeywords,
    } = body;

    // seoKeywords 업데이트 시 usage도 정리
    const updateData: any = {
      ...(typeof enabled === "boolean" && { enabled }),
      ...(typeof postsPerDay === "number" && { postsPerDay }),
      ...(typeof commentsPerPost === "number" && { commentsPerPost }),
      ...(typeof repliesPerComment === "number" && { repliesPerComment }),
      ...(typeof activeStartHour === "number" && { activeStartHour }),
      ...(typeof activeEndHour === "number" && { activeEndHour }),
      ...(typeof realPostAutoReply === "boolean" && { realPostAutoReply }),
    };

    if (Array.isArray(seoKeywords)) {
      const currentConfig = await prisma.autoContentConfig.findUnique({
        where: { id: "singleton" },
        select: { seoKeywordUsage: true },
      });
      const currentUsage = (currentConfig?.seoKeywordUsage as Record<string, number>) || {};
      const newKeywordsSet = new Set(seoKeywords);
      const cleanedUsage: Record<string, number> = {};
      for (const [k, v] of Object.entries(currentUsage)) {
        if (newKeywordsSet.has(k)) cleanedUsage[k] = v;
      }
      updateData.seoKeywords = seoKeywords;
      updateData.seoKeywordUsage = cleanedUsage;
    }

    const config = await prisma.autoContentConfig.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
        enabled: enabled ?? false,
        postsPerDay: postsPerDay ?? 8,
        commentsPerPost: commentsPerPost ?? 3,
        repliesPerComment: repliesPerComment ?? 1,
        activeStartHour: activeStartHour ?? 14,
        activeEndHour: activeEndHour ?? 4,
        realPostAutoReply: realPostAutoReply ?? true,
        seoKeywords: seoKeywords ?? [],
        seoKeywordUsage: {},
      },
      update: updateData,
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error("Config update error:", error);
    return NextResponse.json(
      { error: "설정 저장에 실패했습니다" },
      { status: 500 }
    );
  }
}
