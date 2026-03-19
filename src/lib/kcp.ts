import crypto from "crypto";

// ── KCP 환경변수 ──

const KCP_SITE_CD = process.env.KCP_SITE_CD || "";
const KCP_CERT_INFO = process.env.KCP_CERT_INFO || "";
const KCP_PRIVATE_KEY_BASE64 = process.env.KCP_PRIVATE_KEY_BASE64 || "";
const KCP_PRIVATE_KEY_PASSWORD = process.env.KCP_PRIVATE_KEY_PASSWORD || "changeit";
const KCP_CERT_API_URL = process.env.KCP_CERT_API_URL || "https://stg-spl.kcp.co.kr/std/certpass";
const KCP_CERT_PAGE_URL = process.env.KCP_CERT_PAGE_URL || "https://testcert.kcp.co.kr/kcp_cert/cert_view.jsp";

export { KCP_SITE_CD, KCP_CERT_PAGE_URL };

// ── 타입 ──

export interface UpHashResult {
  upHash: string;
  kcpMerchantTime: string;
  kcpCertLibVer: string;
}

export interface DecryptResult {
  userName: string;
  birthDay: string;
  phoneNo: string;
  sexCode: string;
  ci: string;
  di: string;
}

// ── SHA256withRSA 서명 ──

function makeSignatureData(data: string): string {
  const privateKey = Buffer.from(KCP_PRIVATE_KEY_BASE64, "base64").toString("utf8");
  return crypto
    .createSign("sha256")
    .update(data)
    .sign(
      {
        format: "pem",
        key: privateKey,
        passphrase: KCP_PRIVATE_KEY_PASSWORD,
      },
      "base64"
    );
}

// ── KCP API 호출 공통 ──

async function callKcpApi(reqData: Record<string, string>): Promise<Record<string, string>> {
  const res = await fetch(KCP_CERT_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(reqData),
  });

  if (!res.ok) {
    throw new Error(`KCP API error: ${res.status}`);
  }

  return res.json();
}

// ── up_hash 생성 (ct_type=HAS) ──

export async function generateUpHash(orderId: string, makeReqDt: string): Promise<UpHashResult> {
  const ctType = "HAS";
  const hashData = `${KCP_SITE_CD}^${ctType}^${makeReqDt}`;
  const kcpSignData = makeSignatureData(hashData);

  const reqData = {
    site_cd: KCP_SITE_CD,
    kcp_cert_info: KCP_CERT_INFO,
    ct_type: ctType,
    ordr_idxx: orderId,
    web_siteid: "",
    make_req_dt: makeReqDt,
    kcp_sign_data: kcpSignData,
  };

  const data = await callKcpApi(reqData);

  if (data.res_cd !== "0000") {
    throw new Error(`KCP up_hash 생성 실패: ${data.res_cd} - ${data.res_msg}`);
  }

  return {
    upHash: data.up_hash,
    kcpMerchantTime: data.kcp_merchant_time,
    kcpCertLibVer: data.kcp_cert_lib_ver,
  };
}

// ── dn_hash 검증 (ct_type=CHK) ──

export async function verifyDnHash(
  certNo: string,
  dnHash: string,
  orderId: string
): Promise<boolean> {
  const ctType = "CHK";
  const hashData = `${KCP_SITE_CD}^${ctType}^${certNo}^${dnHash}`;
  const kcpSignData = makeSignatureData(hashData);

  const reqData = {
    kcp_cert_info: KCP_CERT_INFO,
    site_cd: KCP_SITE_CD,
    ordr_idxx: orderId,
    cert_no: certNo,
    dn_hash: dnHash,
    ct_type: ctType,
    kcp_sign_data: kcpSignData,
  };

  const data = await callKcpApi(reqData);
  return data.res_cd === "0000";
}

// ── 데이터 복호화 (ct_type=DEC) ──

export async function decryptCertData(
  certNo: string,
  encCertData: string,
  orderId: string
): Promise<DecryptResult> {
  const ctType = "DEC";
  const hashData = `${KCP_SITE_CD}^${ctType}^${certNo}`;
  const kcpSignData = makeSignatureData(hashData);

  const reqData = {
    kcp_cert_info: KCP_CERT_INFO,
    site_cd: KCP_SITE_CD,
    ordr_idxx: orderId,
    cert_no: certNo,
    ct_type: ctType,
    enc_cert_Data: encCertData,
    kcp_sign_data: kcpSignData,
  };

  const data = await callKcpApi(reqData);

  if (data.res_cd !== "0000") {
    throw new Error(`KCP 복호화 실패: ${data.res_cd} - ${data.res_msg}`);
  }

  return {
    userName: data.user_name || "",
    birthDay: data.birth_day || "",
    phoneNo: data.phone_no || "",
    sexCode: data.sex_code || "",
    ci: data.ci || "",
    di: data.di || "",
  };
}

// ── make_req_dt 생성 (YYMMDDHHmmss) ──

export function makeMakeReqDt(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mi = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  return `${yy}${mm}${dd}${hh}${mi}${ss}`;
}
