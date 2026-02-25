import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { GhostPersonality, ContentType } from "@/generated/prisma/client";
import {
  getPostGenerationPrompt,
  getCommentGenerationPrompt,
  getReplyGenerationPrompt,
} from "@/lib/auto-content/prompts";
import { logAiUsage } from "@/lib/ai-usage";

const anthropic = new Anthropic();

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "AI 서비스를 사용할 수 없습니다" }, { status: 503 });
    }

    const body = await request.json();
    const { type, count = 10 } = body as { type: ContentType; count: number };

    if (type !== "POST") {
      return NextResponse.json({ error: "게시글만 미리 생성할 수 있습니다" }, { status: 400 });
    }

    if (count < 1 || count > 100) {
      return NextResponse.json({ error: "생성 수는 1~100 사이여야 합니다" }, { status: 400 });
    }

    // SEO 키워드 + 사용 횟수 조회
    const config = await prisma.autoContentConfig.findUnique({
      where: { id: "singleton" },
      select: { seoKeywords: true, seoKeywordUsage: true },
    });
    const allKeywords = config?.seoKeywords || [];
    const usageMap: Record<string, number> = (config?.seoKeywordUsage as Record<string, number>) || {};

    // 사용된 키워드 추적
    const usedKeywordsSet = new Set<string>();

    const personalities: GhostPersonality[] = [
      "CHATTY", "ADVISOR", "QUESTIONER", "EMOJI_LOVER", "CALM", "SASSY",
    ];

    let totalGenerated = 0;
    const perPersonality = Math.ceil(count / personalities.length);

    for (const personality of personalities) {
      const toGenerate = Math.min(perPersonality, count - totalGenerated);
      if (toGenerate <= 0) break;

      // 사용 횟수 기반 라운드로빈 선택
      let selectedKeywords: string[] = [];
      if (allKeywords.length > 0) {
        const numKeywords = Math.floor(Math.random() * 2) + 5; // 5 or 6
        // 사용 횟수 오름차순 정렬 (적게 사용된 것 우선, 동일하면 랜덤)
        const sorted = [...allKeywords].sort((a, b) => {
          const diff = (usageMap[a] || 0) - (usageMap[b] || 0);
          return diff !== 0 ? diff : Math.random() - 0.5;
        });
        selectedKeywords = sorted.slice(0, Math.min(numKeywords, allKeywords.length));
        selectedKeywords.forEach(k => usedKeywordsSet.add(k));
      }

      let prompt: string;
      if (type === "POST") {
        prompt = getPostGenerationPrompt(personality, toGenerate, selectedKeywords);
      } else if (type === "COMMENT") {
        prompt = getCommentGenerationPrompt(personality, toGenerate);
      } else {
        prompt = getReplyGenerationPrompt(personality, toGenerate);
      }

      try {
        const message = await anthropic.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 4000,
          messages: [{ role: "user", content: prompt }],
        });

        // AI 사용량 로깅
        await logAiUsage(
          message.model,
          message.usage.input_tokens,
          message.usage.output_tokens,
          `auto-content-${type.toLowerCase()}`
        );

        const text = message.content[0].type === "text" ? message.content[0].text : "";

        // Parse JSON from response
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) continue;

        const items = JSON.parse(jsonMatch[0]) as Array<{
          title?: string;
          content: string;
        }>;

        // Save to ContentPool in batch
        await prisma.contentPool.createMany({
          data: items.map((item) => ({
            type,
            personality,
            title: item.title || null,
            content: item.content,
            category: type === "POST" ? "CHAT" : null,
            isUsed: false,
          })),
        });

        totalGenerated += items.length;
      } catch (err) {
        console.error(`AI generation error for ${personality}:`, err instanceof Error ? err.message : err);
        console.error(`Full error:`, JSON.stringify(err, Object.getOwnPropertyNames(err as object)));
        continue;
      }
    }

    // 사용 횟수 업데이트
    if (usedKeywordsSet.size > 0) {
      const updatedUsage = { ...usageMap };
      usedKeywordsSet.forEach(k => {
        updatedUsage[k] = (updatedUsage[k] || 0) + 1;
      });
      await prisma.autoContentConfig.update({
        where: { id: "singleton" },
        data: { seoKeywordUsage: updatedUsage },
      });
    }

    return NextResponse.json({
      message: `${totalGenerated}개의 콘텐츠가 생성되었습니다`,
      generated: totalGenerated,
      type,
    });
  } catch (error) {
    console.error("Content generation error:", error);
    return NextResponse.json(
      { error: "콘텐츠 생성 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
