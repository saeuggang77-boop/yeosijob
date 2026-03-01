import { prisma } from "@/lib/prisma";

// 메모리 캐시 (5분)
let cachedWords: string[] | null = null;
let cacheExpiry = 0;

export async function checkSpamWords(text: string): Promise<{ isSpam: boolean; matchedWord?: string }> {
  // 캐시 만료 시 DB에서 다시 조회
  if (!cachedWords || Date.now() > cacheExpiry) {
    const words = await prisma.spamWord.findMany({ select: { word: true } });
    cachedWords = words.map(w => w.word.toLowerCase());
    cacheExpiry = Date.now() + 5 * 60 * 1000; // 5분 캐시
  }

  const lowerText = text.toLowerCase();
  for (const word of cachedWords) {
    if (lowerText.includes(word)) {
      return { isSpam: true, matchedWord: word };
    }
  }
  return { isSpam: false };
}

// 캐시 무효화 (단어 추가/삭제 시 호출)
export function invalidateSpamCache() {
  cachedWords = null;
  cacheExpiry = 0;
}
