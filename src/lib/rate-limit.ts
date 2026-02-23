const rateLimit = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  limit: number = 5,
  windowMs: number = 60 * 1000 // 1 minute
): { success: boolean; remaining: number } {
  const now = Date.now();
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

// Cleanup old entries periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimit) {
    if (now > entry.resetAt) {
      rateLimit.delete(key);
    }
  }
}, 5 * 60 * 1000);
