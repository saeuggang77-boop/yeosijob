import { createHmac, randomUUID } from "crypto";

const API_KEY = process.env.SOLAPI_API_KEY || "";
const API_SECRET = process.env.SOLAPI_API_SECRET || "";
const SENDER = process.env.SOLAPI_SENDER || "";

function getAuthHeader(): string {
  const date = new Date().toISOString();
  const salt = randomUUID();
  const signature = createHmac("sha256", API_SECRET)
    .update(date + salt)
    .digest("hex");
  return `HMAC-SHA256 apiKey=${API_KEY}, date=${date}, salt=${salt}, signature=${signature}`;
}

/**
 * SMS 발송 (SOLAPI)
 * 실패해도 throw하지 않음 (fire and forget용)
 */
export async function sendSms(
  to: string,
  text: string
): Promise<{ success: boolean; error?: string }> {
  if (!API_KEY || !API_SECRET || !SENDER) {
    console.warn("SMS 환경변수 미설정, 발송 건너뜀");
    return { success: false, error: "SMS 환경변수 미설정" };
  }

  // 전화번호에서 하이픈 제거
  const phone = to.replace(/[^0-9]/g, "");
  if (!phone || phone.length < 10) {
    return { success: false, error: "유효하지 않은 전화번호" };
  }

  try {
    const res = await fetch("https://api.solapi.com/messages/v4/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: getAuthHeader(),
      },
      body: JSON.stringify({
        message: {
          to: phone,
          from: SENDER,
          text,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("SMS 발송 실패:", err);
      return { success: false, error: err };
    }

    return { success: true };
  } catch (err) {
    console.error("SMS 발송 오류:", err);
    return { success: false, error: String(err) };
  }
}
