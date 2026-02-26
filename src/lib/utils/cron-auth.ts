import { NextRequest } from "next/server";
import { timingSafeEqual } from "crypto";

/**
 * Vercel Cron 또는 수동 호출 시 CRON_SECRET 검증
 * Header: Authorization: Bearer <CRON_SECRET>
 */
export function verifyCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return false;

  const token = authHeader.replace("Bearer ", "");
  const secret = process.env.CRON_SECRET || "";

  if (!token || !secret) return false;
  if (token.length !== secret.length) return false;

  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(secret));
  } catch {
    return false;
  }
}
