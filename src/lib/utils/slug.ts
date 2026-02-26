import { prisma } from "@/lib/prisma";

/**
 * 한글 제목에서 URL 슬러그 생성
 * "강남 카페알바 3개월차 팁 공유합니다" → "강남-카페알바-3개월차-팁-공유합니다"
 */
export function generateSlugFromTitle(title: string): string {
  return title
    // 자음/모음만 반복되는 것 제거 (ㅋㅋ, ㅎㅎ, ㅠㅠ 등)
    .replace(/[ㄱ-ㅎㅏ-ㅣ]+/g, "")
    // 이모지/특수문자 제거 (한글, 영문, 숫자, 공백만 유지)
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    // 연속 공백 → 단일 공백
    .replace(/\s+/g, " ")
    .trim()
    // 공백 → 하이픈
    .replace(/\s/g, "-")
    // 연속 하이픈 제거
    .replace(/-+/g, "-")
    // 앞뒤 하이픈 제거
    .replace(/^-|-$/g, "")
    // 60자 제한
    .substring(0, 60)
    // 끝이 하이픈이면 제거
    .replace(/-$/, "")
    || "post";
}

/**
 * 유니크 슬러그 생성 (중복 시 -2, -3 suffix 추가)
 */
export async function createUniqueSlug(title: string): Promise<string> {
  const baseSlug = generateSlugFromTitle(title);

  // 먼저 기본 슬러그 확인
  const existing = await prisma.post.findUnique({ where: { slug: baseSlug } });
  if (!existing) return baseSlug;

  // 중복이면 숫자 suffix 추가
  for (let i = 2; i <= 100; i++) {
    const candidateSlug = `${baseSlug}-${i}`;
    const found = await prisma.post.findUnique({ where: { slug: candidateSlug } });
    if (!found) return candidateSlug;
  }

  // 극단적 경우: cuid 일부 추가
  return `${baseSlug}-${Date.now().toString(36)}`;
}
