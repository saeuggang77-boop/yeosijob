import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redis = new Redis({ url, token });
  return redis;
}

// 폴백: 메모리 기반 (로컬 개발용, Upstash 미설정 시)
const memoryRateLimit = new Map<string, { count: number; resetAt: number }>();

function checkRateLimitMemory(
  key: string,
  limit: number,
  windowMs: number
): { success: boolean; remaining: number } {
  const now = Date.now();
  for (const [k, entry] of memoryRateLimit) {
    if (now > entry.resetAt) memoryRateLimit.delete(k);
  }
  const entry = memoryRateLimit.get(key);
  if (!entry || now > entry.resetAt) {
    memoryRateLimit.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }
  if (entry.count >= limit) return { success: false, remaining: 0 };
  entry.count++;
  return { success: true, remaining: limit - entry.count };
}

export async function checkRateLimit(
  key: string,
  limit: number = 5,
  windowMs: number = 60 * 1000
): Promise<{ success: boolean; remaining: number }> {
  const client = getRedis();

  if (!client) {
    // Fail-closed: 프로덕션에서는 Redis 없으면 요청 거부
    if (process.env.NODE_ENV === "production") {
      return { success: false, remaining: 0 };
    }
    // 개발환경에서만 메모리 폴백 허용
    return checkRateLimitMemory(key, limit, windowMs);
  }

  try {
    const windowSec = Math.ceil(windowMs / 1000);
    const redisKey = `rl:${key}`;

    const count = await client.incr(redisKey);
    if (count === 1) {
      await client.expire(redisKey, windowSec);
    }

    return {
      success: count <= limit,
      remaining: Math.max(0, limit - count),
    };
  } catch {
    // Redis 실패 시 메모리 폴백
    return checkRateLimitMemory(key, limit, windowMs);
  }
}
