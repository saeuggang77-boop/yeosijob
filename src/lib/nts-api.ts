/**
 * 국세청 사업자등록 상태조회 API
 * https://www.data.go.kr/data/15081808/openapi.do
 */

export interface NtsResult {
  valid: boolean;
  status: string;
  statusCode: string;
}

export async function verifyBusinessNumber(bizNo: string, ownerName?: string): Promise<NtsResult> {
  const cleaned = bizNo.replace(/-/g, "");

  if (cleaned.length !== 10 || !/^\d{10}$/.test(cleaned)) {
    return { valid: false, status: "번호오류", statusCode: "" };
  }

  const apiKey = process.env.NTS_API_KEY;
  if (!apiKey) {
    return { valid: false, status: "미확인", statusCode: "" };
  }

  const attempt = async (): Promise<NtsResult> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      // ownerName이 있으면 진위확인 API 사용
      if (ownerName) {
        const res = await fetch(
          `https://api.odcloud.kr/api/nts-businessman/v1/validate?serviceKey=${encodeURIComponent(apiKey)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              businesses: [{
                b_no: cleaned,
                p_nm: ownerName,
                start_dt: "",
                p_nm2: "", b_nm: "", corp_no: "", b_sector: "", b_type: "", b_adr: "",
              }],
            }),
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

        if (data.valid === "01") {
          return { valid: true, status: "확인완료", statusCode: "01" };
        } else {
          return { valid: false, status: "불일치", statusCode: "02" };
        }
      }

      // 기존 상태조회 API
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
      clearTimeout(timeout);
      throw error;
    }
  };

  try {
    return await attempt();
  } catch (error) {
    console.warn("NTS API 1차 시도 실패, 재시도:", error);
    try {
      return await attempt();
    } catch (retryError) {
      console.error("NTS API 재시도도 실패:", retryError);
      return { valid: false, status: "국세청 서버가 일시적으로 응답하지 않습니다. 잠시 후 다시 시도해주세요", statusCode: "" };
    }
  }
}
