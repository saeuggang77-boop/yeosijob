import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { generateUpHash, makeMakeReqDt, KCP_SITE_CD, KCP_CERT_PAGE_URL } from "@/lib/kcp";

export async function POST(request: NextRequest) {
  try {
    if (!KCP_SITE_CD) {
      return NextResponse.json(
        { error: "본인인증 서비스가 설정되지 않았습니다" },
        { status: 503 }
      );
    }

    // Rate limit: IP 기준 분당 5회
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const { success: rateLimitOk } = await checkRateLimit(`kcp-init:${ip}`, 5, 60_000);
    if (!rateLimitOk) {
      return NextResponse.json(
        { error: "너무 많은 요청입니다. 잠시 후 다시 시도해주세요" },
        { status: 429 }
      );
    }

    // orderId 생성
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const orderId = `AGE${timestamp}${random}`;

    // make_req_dt 생성 (YYMMDDHHmmss)
    const makeReqDt = makeMakeReqDt();

    // KCP API로 up_hash 생성
    const { upHash, kcpMerchantTime, kcpCertLibVer } = await generateUpHash(orderId, makeReqDt);

    // Ret_URL 결정
    const host = request.headers.get("host") || "localhost:3001";
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const retUrl = `${protocol}://${host}/api/auth/verify-age/kcp-callback`;

    return NextResponse.json({
      actionUrl: KCP_CERT_PAGE_URL,
      formData: {
        req_tx: "cert",
        cert_method: "01",
        site_cd: KCP_SITE_CD,
        ordr_idxx: orderId,
        up_hash: upHash,
        Ret_URL: retUrl,
        cert_otp_use: "Y",
        cert_enc_use_ext: "Y",
        web_siteid: "",
        web_siteid_hashYN: "",
        kcp_merchant_time: kcpMerchantTime,
        kcp_cert_lib_ver: kcpCertLibVer,
        kcp_page_submit_yn: "Y",
      },
    });
  } catch (error) {
    console.error("KCP init error:", error);
    return NextResponse.json(
      { error: "본인인증 초기화에 실패했습니다" },
      { status: 500 }
    );
  }
}
