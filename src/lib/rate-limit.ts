// NOTE: 서버리스 환경에서는 인스턴스별 독립 동작. 완전한 보호를 위해 Redis 전환 필요
const rateLimit = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  limit: number = 5,
  windowMs: number = 60 * 1000 // 1 minute
): { success: boolean; remaining: number } {
  const now = Date.now();

  // Lazy cleanup: 호출 시마다 만료된 항목 정리
  for (const [k, entry] of rateLimit) {
    if (now > entry.resetAt) {
      rateLimit.delete(k);
    }
  }

  const entry = rateLimit.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimit.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0 };
  }

  entry.count++;
  return { success: true, remaining: limit - entry.count };
}
