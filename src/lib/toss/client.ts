/**
 * Toss Payments 설정
 * 환경변수:
 *   NEXT_PUBLIC_TOSS_CLIENT_KEY - 클라이언트 키 (프론트)
 *   TOSS_SECRET_KEY - 시크릿 키 (서버)
 */

export const TOSS_CLIENT_KEY =
  process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || "test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq";

export const TOSS_SECRET_KEY =
  process.env.TOSS_SECRET_KEY || "test_sk_zXLkKEypNArWmo50nX3lmeaxYG5R";

export const TOSS_API_URL = "https://api.tosspayments.com/v1";
