import { prisma } from "@/lib/prisma";
import { GhostPersonality, ContentType } from "@/generated/prisma/client";
import Anthropic from "@anthropic-ai/sdk";
import {
  getContextualCommentPrompt,
  getContextualReplyPrompt,
  getConversationThreadPrompt,
} from "./prompts";
import { logAiUsage } from "@/lib/ai-usage";

/**
 * 자정 넘기는 시간대 처리 (예: 14시~4시)
 */
export function isWithinActiveHours(kstHour: number, start: number, end: number): boolean {
  if (start === end) return true; // 0시~0시 = 24시간
  if (start < end) {
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
 * 게시글 ID 기반 결정론적 대화 목표 계산
 * 같은 게시글은 항상 같은 목표값을 반환 (min~max 사이)
 */
export function getPostConversationTarget(postId: string, min: number, max: number): number {
  let hash = 0;
  for (let i = 0; i < postId.length; i++) {
    hash = ((hash << 5) - hash) + postId.charCodeAt(i);
    hash |= 0;
  }
  const norm = Math.abs(hash) % (max - min + 1);
  return min + norm;
}

/**
 * 활성 시간대의 총 시간 수 계산
 */
export function getActiveHoursCount(start: number, end: number): number {
  if (start === end) return 24; // 0시~0시 = 24시간
  if (start < end) {
    return end - start;
  }
  return (24 - start) + end;
}

/**
 * 슬롯별 할당량 계산 (+-50% 랜덤 분산)
 * base < 1일 때 최소 40% 확률로 1을 반환
 * (remainingPosts가 소진되면 자연히 0이 되므로 초과 발행 없음)
 */
export function getSlotQuota(dailyQuota: number, totalSlots: number): number {
  if (totalSlots === 0 || dailyQuota <= 0) return 0;
  const base = dailyQuota / totalSlots;
  if (base < 1) {
    return Math.random() < Math.max(base, 0.4) ? 1 : 0;
  }
  const variance = base * 0.5;
  return Math.max(1, Math.round(base + (Math.random() * 2 - 1) * variance));
}

/**
 * 랜덤 유령회원 조회
 */
export async function getRandomGhostUsers(count: number, personality?: GhostPersonality, excludeUserId?: string) {
  const where: Record<string, unknown> = { isGhost: true, isActive: true };
  if (personality) where.ghostPersonality = personality;
  if (excludeUserId) where.id = { not: excludeUserId };

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
 * 오늘 고스트가 생성한 항목 수 조회 (KST 자정 기준)
 */
export async function getTodayGhostCounts() {
  // KST 자정 기준 (UTC+9)
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstNow = new Date(now.getTime() + kstOffset);
  const todayStart = new Date(
    Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate()) - kstOffset
  );

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
      model: "claude-sonnet-4-5-20250929",
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
  count: number,
  personality?: GhostPersonality
): Promise<string[]> {
  try {
    const anthropic = new Anthropic();

    // 지정된 성격 사용, 없으면 랜덤
    const personalities: GhostPersonality[] = [
      "CHATTY",
      "ADVISOR",
      "QUESTIONER",
      "EMOJI_LOVER",
      "CALM",
      "SASSY",
    ];
    const selectedPersonality = personality || personalities[Math.floor(Math.random() * personalities.length)];

    const prompt = getContextualReplyPrompt(selectedPersonality, postTitle, commentContent, count);

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
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

/**
 * 게시글에 대한 전체 대화 스레드 생성 (댓글+답글 통합)
 */
export async function generateConversationThread(
  post: { id: string; title: string; content: string; authorId: string },
  threadSize: number,
  authorReplyRate: number = 50
): Promise<{ commentCount: number; replyCount: number }> {
  try {
    // 1. 글쓴이 정보 조회
    const author = await prisma.user.findUnique({
      where: { id: post.authorId },
      select: { name: true, ghostPersonality: true },
    });

    if (!author || !author.ghostPersonality) {
      throw new Error("Author not found or not a ghost user");
    }

    // 2. 랜덤 유령회원 선택 (글쓴이 제외)
    // 30% 확률로 깊은 대화 모드 (1~2명으로 집중)
    const isDeepConversation = Math.random() < 0.3;
    const commenterCount = isDeepConversation
      ? Math.floor(Math.random() * 2) + 1  // 1~2명
      : Math.min(Math.max(2, Math.floor(Math.random() * 3) + 2), 4); // 2~4명
    const commenters = await getRandomGhostUsers(commenterCount, undefined, post.authorId);

    if (commenters.length === 0) {
      throw new Error("No commenters available");
    }

    const commenterNames = commenters.map(c => c.name || "익명");
    const commenterPersonalities = commenters.map(c => c.ghostPersonality || "CALM");

    // 3. AI로 대화 스레드 생성
    const anthropic = new Anthropic();
    const prompt = getConversationThreadPrompt(
      author.ghostPersonality,
      author.name || "익명",
      post.title,
      post.content,
      commenterNames,
      commenterPersonalities,
      threadSize,
      authorReplyRate
    );

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 3000,
      messages: [{ role: "user", content: prompt }],
    });

    // AI 사용량 로깅
    await logAiUsage(
      message.model,
      message.usage.input_tokens,
      message.usage.output_tokens,
      "conversation-thread"
    );

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";
    const cleaned = responseText.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
    let parsed = JSON.parse(cleaned) as Array<{
      name: string;
      content: string;
      replyTo: number | null;
    }>;

    // 3.5 안전장치: 작성자가 최상위 댓글(replyTo: null)을 쓴 경우 제거
    // 작성자는 답글(replyTo: 숫자)만 달아야 자연스러움
    const authorNameStr = author.name || "익명";
    const originalLength = parsed.length;
    parsed = parsed.filter((msg, idx) => {
      if (msg.name === authorNameStr && (msg.replyTo === null || msg.replyTo === undefined)) {
        // 첫 메시지가 아닌 경우에만 제거 (replyTo 인덱스 재조정이 복잡해지므로)
        // 첫 메시지가 작성자인 경우도 제거하고 인덱스 재조정
        return false;
      }
      return true;
    });

    // replyTo 인덱스 재조정 (제거된 항목 반영)
    if (parsed.length < originalLength) {
      // 원본 인덱스 → 새 인덱스 매핑 테이블 생성
      const originalParsed = JSON.parse(cleaned) as Array<{ name: string; content: string; replyTo: number | null }>;
      const oldToNew = new Map<number, number>();
      let newIdx = 0;
      for (let oldIdx = 0; oldIdx < originalParsed.length; oldIdx++) {
        const msg = originalParsed[oldIdx];
        if (msg.name === authorNameStr && (msg.replyTo === null || msg.replyTo === undefined)) {
          continue; // 제거된 항목
        }
        oldToNew.set(oldIdx, newIdx);
        newIdx++;
      }

      // replyTo 인덱스 갱신
      parsed = parsed.map((msg, idx) => {
        if (msg.replyTo !== null && msg.replyTo !== undefined) {
          const newReplyTo = oldToNew.get(msg.replyTo);
          if (newReplyTo === undefined) {
            // 참조 대상이 제거된 경우 → 가장 가까운 이전 최상위 댓글에 답글로 연결
            let fallbackIdx: number | null = null;
            for (let k = idx - 1; k >= 0; k--) {
              if (parsed[k].replyTo === null || parsed[k].replyTo === undefined) {
                fallbackIdx = k;
                break;
              }
            }
            if (fallbackIdx !== null) {
              return { ...msg, replyTo: fallbackIdx };
            }
            // 이전 최상위 댓글이 없으면 첫 번째 메시지에 연결
            return { ...msg, replyTo: 0 };
          }
          return { ...msg, replyTo: newReplyTo };
        }
        return msg;
      });

      // 3.6 2차 안전장치: 인덱스 재조정으로 작성자 최상위 댓글이 새로 생긴 경우 처리
      parsed = parsed.map((msg, idx) => {
        if (msg.name === authorNameStr && (msg.replyTo === null || msg.replyTo === undefined)) {
          // 가장 가까운 이전 비작성자 최상위 댓글에 답글로 연결
          for (let k = idx - 1; k >= 0; k--) {
            if (parsed[k].name !== authorNameStr && (parsed[k].replyTo === null || parsed[k].replyTo === undefined)) {
              return { ...msg, replyTo: k };
            }
          }
          // 이전에 없으면 가장 가까운 이후 비작성자 최상위 댓글에 연결
          for (let k = idx + 1; k < parsed.length; k++) {
            if (parsed[k].name !== authorNameStr && (parsed[k].replyTo === null || parsed[k].replyTo === undefined)) {
              return { ...msg, replyTo: k };
            }
          }
          // 비작성자 최상위 댓글이 없으면 첫 번째 메시지에 연결 (자신이 아닌 경우)
          if (idx !== 0) return { ...msg, replyTo: 0 };
          // 전부 작성자뿐이면 제거 대상 마킹
          return { ...msg, replyTo: -999 };
        }
        return msg;
      });
      // -999로 마킹된 항목 제거
      parsed = parsed.filter(msg => msg.replyTo !== -999);
    }

    // 4. name → userId 매핑
    const nameToUserId = new Map<string, string>();
    nameToUserId.set(author.name || "익명", post.authorId);
    commenters.forEach(c => {
      nameToUserId.set(c.name || "익명", c.id);
    });

    // 5. DB에 저장 (순서대로 생성하면서 인덱스→실제ID 매핑)
    const indexToCommentId = new Map<number, string>();
    const indexToParentId = new Map<number, string | null>();
    const messagesByIndex = new Map<number, { name: string; content: string }>();
    let commentCount = 0;
    let replyCount = 0;

    // 시간 오프셋: 순차 누적으로 순서 보장 (첫 메시지가 가장 오래전)
    const now = Date.now();
    const intervals: number[] = [];
    for (let i = 0; i < parsed.length; i++) {
      intervals.push(Math.floor(Math.random() * 16) + 5); // 5~20분 간격
    }
    // 역순 누적: 마지막 메시지 = 가장 최근, 첫 메시지 = 가장 오래전
    const cumulativeOffsets: number[] = new Array(parsed.length);
    cumulativeOffsets[parsed.length - 1] = intervals[parsed.length - 1];
    for (let i = parsed.length - 2; i >= 0; i--) {
      cumulativeOffsets[i] = cumulativeOffsets[i + 1] + intervals[i];
    }

    for (let i = 0; i < parsed.length; i++) {
      const msg = parsed[i];
      const userId = nameToUserId.get(msg.name) || post.authorId;

      // replyTo가 가리키는 메시지 정보 저장
      messagesByIndex.set(i, { name: msg.name, content: msg.content });

      let parentId: string | null = null;
      let finalContent = msg.content;

      if (msg.replyTo !== null && msg.replyTo !== undefined) {
        // 답글인 경우
        const targetCommentId = indexToCommentId.get(msg.replyTo) || null;

        // 2단 평탄화: replyTo 대상이 이미 답글(parentId가 있음)이면, 그 최상위로 연결
        const targetParentId = indexToParentId.get(msg.replyTo);
        if (targetParentId !== undefined && targetParentId !== null) {
          // replyTo 대상이 이미 답글이면, 그 부모(최상위)를 사용
          parentId = targetParentId;
        } else {
          // replyTo 대상이 최상위 댓글이면 그대로 사용
          parentId = targetCommentId;
        }

        // @이름 prefix 추가: 부모 체인을 거슬러 올라가 다른 사람 이름 찾기
        let targetName: string | null = null;
        let currentIdx = msg.replyTo as number;
        for (let depth = 0; depth < 10; depth++) {
          const searchMsg = messagesByIndex.get(currentIdx);
          if (searchMsg && searchMsg.name !== msg.name) {
            targetName = searchMsg.name;
            break;
          }
          // 자기 자신이면 부모의 replyTo를 따라감
          const parentReplyTo = parsed[currentIdx]?.replyTo;
          if (parentReplyTo === null || parentReplyTo === undefined) break;
          currentIdx = parentReplyTo;
        }

        if (parentId && targetName) {
          const alreadyMentioned = msg.content.startsWith('@') || msg.content.includes(targetName);
          if (!alreadyMentioned) {
            finalContent = `@${targetName} ${msg.content}`;
          }
        }
      }

      // 시간차 적용: 순차적으로 누적하여 순서 보장
      // 첫 메시지가 가장 오래전, 이후 메시지가 점점 최근
      const createdAt = new Date(now - cumulativeOffsets[i] * 60 * 1000);

      const comment = await prisma.comment.create({
        data: {
          authorId: userId,
          postId: post.id,
          content: finalContent,
          parentId,
          createdAt,
        },
      });

      indexToCommentId.set(i, comment.id);
      indexToParentId.set(i, parentId);

      if (parentId === null) {
        commentCount++;
      } else {
        replyCount++;
      }
    }

    return { commentCount, replyCount };
  } catch (error) {
    console.error("대화 스레드 생성 실패:", error);
    throw error;
  }
}
