/**
 * Toss Payments 설정
 * 환경변수:
 *   NEXT_PUBLIC_TOSS_CLIENT_KEY - 클라이언트 키 (프론트)
 *   TOSS_SECRET_KEY - 시크릿 키 (서버)
 */

const _clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
if (!_clientKey) throw new Error("NEXT_PUBLIC_TOSS_CLIENT_KEY is required");
export const TOSS_CLIENT_KEY: string = _clientKey;

const _secretKey = process.env.TOSS_SECRET_KEY;
if (!_secretKey) throw new Error("TOSS_SECRET_KEY is required");
export const TOSS_SECRET_KEY: string = _secretKey;

export const TOSS_API_URL = "https://api.tosspayments.com/v1";
