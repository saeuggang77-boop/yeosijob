/**
 * Telegram Bot API 유틸리티
 *
 * 여시잡 공식채널(@yeosijob)에 새 이력서 알림을 자동 포스팅합니다.
 * 개인정보(이름, 나이, 사진, 연락처)는 일절 노출하지 않으며, 지역 + 업종만 전송합니다.
 */

interface SendMessageOptions {
  text: string;
  parseMode?: "HTML" | "MarkdownV2";
  disableWebPagePreview?: boolean;
}

/**
 * 텔레그램 채널에 메시지를 전송합니다.
 *
 * 환경변수:
 * - TELEGRAM_BOT_TOKEN: BotFather에서 발급받은 봇 토큰
 * - TELEGRAM_CHANNEL_ID: 채널 username (예: @yeosijob) 또는 chat_id
 *
 * 실패 시 throw 하지 않고 console.error만 기록합니다 (이력서 등록 흐름 차단 방지).
 */
export async function sendTelegramMessage(options: SendMessageOptions): Promise<void> {
  // 로컬/개발 환경에서는 실제 채널에 스팸 발송 방지를 위해 전송 스킵
  // 프로덕션(Vercel)에서만 실제 전송
  if (process.env.NODE_ENV !== "production") {
    console.log("[telegram] 개발 환경 - 전송 스킵. 메시지:", options.text);
    return;
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const channelId = process.env.TELEGRAM_CHANNEL_ID;

  if (!token || !channelId) {
    console.warn("[telegram] TELEGRAM_BOT_TOKEN 또는 TELEGRAM_CHANNEL_ID 미설정 - 전송 스킵");
    return;
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: channelId,
        text: options.text,
        parse_mode: options.parseMode ?? "HTML",
        disable_web_page_preview: options.disableWebPagePreview ?? false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[telegram] 메시지 전송 실패", {
        status: response.status,
        error: errorText,
      });
    }
  } catch (error) {
    console.error("[telegram] 메시지 전송 예외", error);
  }
}

/**
 * 새 이력서 알림 메시지를 공식채널에 전송합니다.
 *
 * 노출 정보 (모두 비식별 광범위 카테고리):
 * - 지역 (광역시 단위)
 * - 희망 업종
 * - 연령대 (10년 단위: 20대/30대/40대+)
 * - 경력 수준
 * - 희망 급여 형태
 *
 * 링크: /business/resumes/{id} (비로그인 시 자동 로그인 리다이렉트)
 */
export async function notifyNewResume(params: {
  resumeId: string;
  regionLabel: string;
  businessTypeLabel: string;
  ageRange: string;
  experienceLabel: string;
  salaryInfo: string;
}): Promise<void> {
  const baseUrl =
    process.env.AUTH_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "https://yeosijob.com";
  const detailUrl = `${baseUrl}/business/resumes/${params.resumeId}`;

  const text =
    `🆕 <b>NEW 이력서 등록</b>\n` +
    `━━━━━━━━━━━━━\n\n` +
    `📍 <b>${escapeHtml(params.regionLabel)}</b>\n` +
    `💼 ${escapeHtml(params.businessTypeLabel)}\n` +
    `👤 ${escapeHtml(params.ageRange)} · 경력 ${escapeHtml(params.experienceLabel)}\n` +
    `💰 ${escapeHtml(params.salaryInfo)}\n\n` +
    `━━━━━━━━━━━━━\n` +
    `⚡ <b>지금 바로 확인하세요</b>\n\n` +
    `<a href="${detailUrl}">👉 여시잡에서 상세정보 보기</a>\n` +
    `<i>연락처 · 사진 · 상세 조건 확인</i>\n\n` +
    `<i>🌙 여시잡 | 유흥알바 No.1 구인구직</i>`;

  await sendTelegramMessage({
    text,
    parseMode: "HTML",
    disableWebPagePreview: false,
  });
}

/**
 * 정확한 나이를 10년 단위 연령대 라벨로 변환합니다.
 * 개인식별 위험을 줄이기 위해 정확한 나이는 채널에 노출하지 않습니다.
 *
 * @example ageToRange(25) // "20대"
 * @example ageToRange(42) // "40대+"
 */
export function ageToRange(age: number): string {
  if (age < 20) return "20대";
  if (age < 30) return "20대";
  if (age < 40) return "30대";
  return "40대+";
}

/**
 * Telegram HTML parse_mode에서 허용되지 않는 특수문자를 이스케이프합니다.
 * https://core.telegram.org/bots/api#html-style
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
