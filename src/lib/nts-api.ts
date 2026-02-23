/**
 * 국세청 사업자등록 상태조회 API
 * https://www.data.go.kr/data/15081808/openapi.do
 */

export interface NtsResult {
  valid: boolean;
  status: string;
  statusCode: string;
}

export async function verifyBusinessNumber(bizNo: string): Promise<NtsResult> {
  const cleaned = bizNo.replace(/-/g, "");

  if (cleaned.length !== 10 || !/^\d{10}$/.test(cleaned)) {
    return { valid: false, status: "번호오류", statusCode: "" };
  }

  const apiKey = process.env.NTS_API_KEY;
  if (!apiKey) {
    return { valid: false, status: "미확인", statusCode: "" };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(
      `https://api.odcloud.kr/api/nts-businessman/v1/status?serviceKey=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ b_no: [cleaned] }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

    if (!res.ok) {
      console.error("NTS API error:", res.status, await res.text());
      return { valid: false, status: "확인불가", statusCode: "" };
    }

    const json = await res.json();
    const data = json.data?.[0];

    if (!data) {
      return { valid: false, status: "확인불가", statusCode: "" };
    }

    const statusCode = data.b_stt_cd || "";
    const status = data.b_stt || "미확인";

    return {
      valid: statusCode === "01",
      status,
      statusCode,
    };
  } catch (error) {
    console.error("NTS API call failed:", error);
    return { valid: false, status: "확인불가", statusCode: "" };
  }
}
