/**
 * 국세청 사업자등록정보 진위확인 API
 * https://www.data.go.kr/data/15081808/openapi.do
 */

interface NtsApiResponse {
  status_code: string;
  data?: Array<{
    b_no: string;
    b_stt: string;
    b_stt_cd: string;
    tax_type: string;
    tax_type_cd: string;
    end_dt?: string;
    utcc_yn?: string;
    tax_type_change_dt?: string;
    invoice_apply_dt?: string;
    rbf_tax_type?: string;
    rbf_tax_type_cd?: string;
  }>;
  request_cnt?: number;
  valid_cnt?: number;
}

interface VerifyResult {
  valid: boolean;
  status: "active" | "suspended" | "closed" | "not_found" | "error";
  message: string;
}

/**
 * 사업자등록번호 형식 검증 (10자리 숫자 + 체크섬)
 */
export function validateBusinessNumberFormat(number: string): boolean {
  if (!number || !/^\d{10}$/.test(number)) {
    return false;
  }

  const digits = number.split("").map(Number);
  const keyArr = [1, 3, 7, 1, 3, 7, 1, 3, 5];

  let chk = 0;
  for (let i = 0; i < 9; i++) {
    chk += keyArr[i] * digits[i];
  }
  chk += Math.floor((keyArr[8] * digits[8]) / 10);

  const checkDigit = (10 - (chk % 10)) % 10;
  return digits[9] === checkDigit;
}

/**
 * 국세청 API로 사업자등록번호 실제 상태 조회
 * ownerName이 있으면 진위확인 API(/v1/validate) 사용, 없으면 기존 상태조회 유지
 */
export async function verifyBusinessNumber(
  bizNum: string,
  ownerName?: string
): Promise<VerifyResult> {
  const apiKey = process.env.NTS_API_KEY;

  if (!apiKey) {
    return {
      valid: false,
      status: "error",
      message: "API 키가 설정되지 않았습니다",
    };
  }

  // 형식 검증
  if (!validateBusinessNumberFormat(bizNum)) {
    return {
      valid: false,
      status: "error",
      message: "사업자등록번호 형식이 올바르지 않습니다",
    };
  }

  const attempt = async (): Promise<VerifyResult> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      // ownerName이 있으면 진위확인 API 시도 → 실패 시 상태조회로 폴백
      if (ownerName) {
        try {
          const validateUrl = `https://api.odcloud.kr/api/nts-businessman/v1/validate?serviceKey=${apiKey}`;
          const validateRes = await fetch(validateUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              businesses: [{
                b_no: bizNum,
                p_nm: ownerName,
                start_dt: "",
                p_nm2: "", b_nm: "", corp_no: "", b_sector: "", b_type: "", b_adr: "",
              }],
            }),
            signal: controller.signal,
          });

          if (validateRes.ok) {
            const data = await validateRes.json();
            const result = data.data?.[0];

            if (result?.valid === "01") {
              return {
                valid: true,
                status: "active",
                message: "사업자 진위확인이 완료되었습니다",
              };
            } else if (result) {
              return {
                valid: false,
                status: "not_found",
                message: "사업자등록번호와 대표자명이 일치하지 않습니다",
              };
            }
          }
          // 진위확인 API 실패(500 등) → 상태조회로 폴백
          console.warn("진위확인 API 실패, 상태조회로 폴백:", validateRes.status);
        } catch (e) {
          // AbortError면 상위로 throw
          if (e instanceof DOMException && e.name === "AbortError") throw e;
          console.warn("진위확인 API 오류, 상태조회로 폴백:", e);
        }
      }

      // 상태조회 API (기본 또는 폴백)
      const url = `https://api.odcloud.kr/api/nts-businessman/v1/status?serviceKey=${apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          b_no: [bizNum],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        return {
          valid: false,
          status: "error",
          message: `API 호출 실패: ${response.status}`,
        };
      }

      const data: NtsApiResponse = await response.json();

      if (!data.data || data.data.length === 0) {
        return {
          valid: false,
          status: "not_found",
          message: "조회 결과가 없습니다",
        };
      }

      const bizInfo = data.data[0];

      // 국세청에 등록되지 않은 번호
      if (bizInfo.tax_type?.includes("국세청에 등록되지 않은")) {
        return {
          valid: false,
          status: "not_found",
          message: "국세청에 등록되지 않은 사업자등록번호입니다",
        };
      }

      // 사업자 상태 코드 확인
      // 01: 계속사업자 (정상), 02: 휴업, 03: 폐업
      switch (bizInfo.b_stt_cd) {
        case "01":
          return {
            valid: true,
            status: "active",
            message: "정상적인 사업자등록번호입니다",
          };
        case "02":
          return {
            valid: false,
            status: "suspended",
            message: "휴업 중인 사업자입니다",
          };
        case "03":
          return {
            valid: false,
            status: "closed",
            message: "폐업한 사업자입니다",
          };
        default:
          return {
            valid: false,
            status: "error",
            message: `알 수 없는 상태: ${bizInfo.b_stt || "미확인"}`,
          };
      }
    } finally {
      clearTimeout(timeout);
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
      return {
        valid: false,
        status: "error",
        message: "국세청 서버가 일시적으로 응답하지 않습니다. 잠시 후 다시 시도해주세요",
      };
    }
  }
}
