import { prisma } from "@/lib/prisma";
import { GhostPersonality, ContentType } from "@/generated/prisma/client";
import Anthropic from "@anthropic-ai/sdk";
import {
  getContextualCommentPrompt,
  getContextualReplyPrompt,
} from "./prompts";
import { logAiUsage } from "@/lib/ai-usage";

/**
 * 자정 넘기는 시간대 처리 (예: 14시~4시)
 */
export function isWithinActiveHours(kstHour: number, start: number, end: number): boolean {
  if (start <= end) {
    return kstHour >= start && kstHour < end;
  }
  return kstHour >= start || kstHour < end;
}

/**
 * 일일 목표에 요일별 + 타입별 랜덤 변동 적용
 * - 금토: +20~30%, 월화: -10~20%, 수목일: ±10%
 * - 콘텐츠 타입별로 독립 변동 (게시글/댓글/답글 각각 다른 값)
 * - 날짜 기반 시드로 같은 날에는 같은 값 유지
 */
export function getDailyTarget(base: number, typeOffset: number = 0): number {
  const today = new Date();
  const kstDay = new Date(today.getTime() + 9 * 60 * 60 * 1000).getUTCDay(); // KST 요일
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate() + typeOffset * 7;
  const pseudo = Math.sin(seed) * 10000;
  const rand = pseudo - Math.floor(pseudo); // 0~1

  // 요일별 기본 배율 (금=5, 토=6)
  let min: number, max: number;
  if (kstDay === 5 || kstDay === 6) {
    min = 1.2; max = 1.3; // 금토: +20~30%
  } else if (kstDay === 1 || kstDay === 2) {
    min = 0.8; max = 0.9; // 월화: -10~20%
  } else {
    min = 0.9; max = 1.1; // 수목일: ±10%
  }

  const ratio = min + rand * (max - min);
  return Math.max(1, Math.round(base * ratio));
}

/**
 * 게시글/댓글 ID 기반 편중 분배
 * 같은 ID는 항상 같은 목표값 → 20% 묻힌 글(0개), 50% 평균, 30% 핫글(2배)
 */
export function getContentTarget(id: string, base: number): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  const norm = Math.abs(Math.sin(hash)); // 0~1

  if (norm < 0.2) return 0; // 20% 묻힌 글
  if (norm < 0.7) return Math.max(1, Math.round(base * (0.5 + norm))); // 50% 평균
  return Math.max(1, Math.round(base * (1.2 + norm * 0.8))); // 30% 핫글
}

/**
 * 활성 시간대의 총 시간 수 계산
 */
export function getActiveHoursCount(start: number, end: number): number {
  if (start <= end) {
    return end - start;
  }
  return (24 - start) + end;
}

/**
 * 슬롯별 할당량 계산 (+-50% 랜덤 분산)
 */
export function getSlotQuota(dailyQuota: number, totalSlots: number): number {
  if (totalSlots === 0) return 0;
  const base = dailyQuota / totalSlots;
  const variance = base * 0.5;
  return Math.max(0, Math.round(base + (Math.random() * 2 - 1) * variance));
}

/**
 * 랜덤 유령회원 조회
 */
export async function getRandomGhostUsers(count: number, personality?: GhostPersonality) {
  const where: Record<string, unknown> = { isGhost: true, isActive: true };
  if (personality) where.ghostPersonality = personality;

  const ghosts = await prisma.user.findMany({
    where,
    select: { id: true, name: true, ghostPersonality: true },
  });

  // Fisher-Yates shuffle
  const shuffled = [...ghosts];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, count);
}

/**
 * 미사용 콘텐츠 풀 아이템 조회
 */
export async function getUnusedContent(type: ContentType, count: number, personality?: GhostPersonality) {
  const where: Record<string, unknown> = { type, isUsed: false };
  if (personality) where.personality = personality;

  const items = await prisma.contentPool.findMany({
    where,
    take: count * 3,
    orderBy: { createdAt: "asc" },
  });

  // Shuffle and take count
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, count);
}

/**
 * 오늘 고스트가 생성한 항목 수 조회
 */
export async function getTodayGhostCounts() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [posts, comments] = await Promise.all([
    prisma.post.count({
      where: {
        createdAt: { gte: todayStart },
        author: { isGhost: true },
      },
    }),
    prisma.comment.count({
      where: {
        createdAt: { gte: todayStart },
        author: { isGhost: true },
      },
    }),
  ]);

  const topLevelComments = await prisma.comment.count({
    where: {
      createdAt: { gte: todayStart },
      author: { isGhost: true },
      parentId: null,
    },
  });

  return {
    posts,
    comments: topLevelComments,
    replies: comments - topLevelComments,
  };
}

/**
 * 게시글 내용 기반 실시간 댓글 생성
 */
export async function generateContextualComments(
  postTitle: string,
  postContent: string,
  count: number
): Promise<string[]> {
  try {
    const anthropic = new Anthropic();

    // 랜덤 성격 선택
    const personalities: GhostPersonality[] = [
      "CHATTY",
      "ADVISOR",
      "QUESTIONER",
      "EMOJI_LOVER",
      "CALM",
      "SASSY",
    ];
    const randomPersonality = personalities[Math.floor(Math.random() * personalities.length)];

    const prompt = getContextualCommentPrompt(randomPersonality, postTitle, postContent, count);

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    // AI 사용량 로깅
    await logAiUsage(
      message.model,
      message.usage.input_tokens,
      message.usage.output_tokens,
      "contextual-comment"
    );

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";
    const cleaned = responseText.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
    const parsed = JSON.parse(cleaned) as Array<{ content: string }>;

    return parsed.map((item) => item.content);
  } catch (error) {
    console.error("실시간 댓글 생성 실패:", error);
    return [];
  }
}

/**
 * 댓글 내용 기반 실시간 답글 생성
 */
export async function generateContextualReplies(
  postTitle: string,
  commentContent: string,
  count: number
): Promise<string[]> {
  try {
    const anthropic = new Anthropic();

    // 랜덤 성격 선택
    const personalities: GhostPersonality[] = [
      "CHATTY",
      "ADVISOR",
      "QUESTIONER",
      "EMOJI_LOVER",
      "CALM",
      "SASSY",
    ];
    const randomPersonality = personalities[Math.floor(Math.random() * personalities.length)];

    const prompt = getContextualReplyPrompt(randomPersonality, postTitle, commentContent, count);

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    // AI 사용량 로깅
    await logAiUsage(
      message.model,
      message.usage.input_tokens,
      message.usage.output_tokens,
      "contextual-reply"
    );

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";
    const cleaned = responseText.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
    const parsed = JSON.parse(cleaned) as Array<{ content: string }>;

    return parsed.map((item) => item.content);
  } catch (error) {
    console.error("실시간 답글 생성 실패:", error);
    return [];
  }
}
