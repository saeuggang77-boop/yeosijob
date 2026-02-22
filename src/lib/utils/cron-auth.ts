import { NextRequest } from "next/server";

/**
 * Vercel Cron 또는 수동 호출 시 CRON_SECRET 검증
 * Header: Authorization: Bearer <CRON_SECRET>
 */
export function verifyCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return false;

  const token = authHeader.replace("Bearer ", "");
  return token === process.env.CRON_SECRET;
}
