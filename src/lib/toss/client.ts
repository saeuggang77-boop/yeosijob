/**
 * Toss Payments 설정
 * 환경변수:
 *   NEXT_PUBLIC_TOSS_CLIENT_KEY - 클라이언트 키 (프론트)
 *   TOSS_SECRET_KEY - 시크릿 키 (서버)
 */

export const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? "";
export const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY ?? "";

export function assertTossKeys() {
  if (!TOSS_CLIENT_KEY) throw new Error("NEXT_PUBLIC_TOSS_CLIENT_KEY is required");
  if (!TOSS_SECRET_KEY) throw new Error("TOSS_SECRET_KEY is required");
}

export const TOSS_API_URL = "https://api.tosspayments.com/v1";
