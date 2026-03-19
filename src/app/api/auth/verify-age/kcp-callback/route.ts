import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { verifyDnHash, decryptCertData } from "@/lib/kcp";

const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30일 (초)

function calculateAge(birthDateStr: string): number {
  // birthDateStr: "YYYYMMDD"
  const year = parseInt(birthDateStr.substring(0, 4), 10);
  const month = parseInt(birthDateStr.substring(4, 6), 10);
  const day = parseInt(birthDateStr.substring(6, 8), 10);

  const now = new Date();
  let age = now.getFullYear() - year;
  if (
    now.getMonth() + 1 < month ||
    (now.getMonth() + 1 === month && now.getDate() < day)
  ) {
    age--;
  }
  return age;
}

function buildRedirectUrl(request: NextRequest, path: string): URL {
  const host = request.headers.get("host") || "localhost:3001";
  const protocol = request.headers.get("x-forwarded-proto") || "http";
  return new URL(path, `${protocol}://${host}`);
}

export async function POST(request: NextRequest) {
  try {
    // KCP는 URL-encoded form data로 POST
    const formData = await request.formData();

    const resCd = formData.get("res_cd") as string;
    const certNo = formData.get("cert_no") as string;
    const dnHash = formData.get("dn_hash") as string;
    const encCertData2 = formData.get("enc_cert_data2") as string;
    const orderId = formData.get("ordr_idxx") as string;

    // 인증 실패/취소
    if (resCd !== "0000") {
      const resMsg = formData.get("res_msg") as string;
      console.error("KCP cert failed:", resCd, resMsg);
      const redirectUrl = buildRedirectUrl(request, "/verify-age/callback?status=error&reason=cancelled");
      return NextResponse.redirect(redirectUrl, 302);
    }

    if (!certNo || !dnHash || !encCertData2 || !orderId) {
      console.error("KCP callback missing fields:", { certNo: !!certNo, dnHash: !!dnHash, encCertData2: !!encCertData2, orderId: !!orderId });
      const redirectUrl = buildRedirectUrl(request, "/verify-age/callback?status=error&reason=invalid");
      return NextResponse.redirect(redirectUrl, 302);
    }

    // Step 1: dn_hash 검증
    const dnValid = await verifyDnHash(certNo, dnHash, orderId);
    if (!dnValid) {
      console.error("KCP dn_hash verification failed");
      const redirectUrl = buildRedirectUrl(request, "/verify-age/callback?status=error&reason=tampered");
      return NextResponse.redirect(redirectUrl, 302);
    }

    // Step 2: 데이터 복호화
    const decrypted = await decryptCertData(certNo, encCertData2, orderId);

    // Step 3: 만 19세 이상 확인
    const age = calculateAge(decrypted.birthDay);
    if (age < 19) {
      const redirectUrl = buildRedirectUrl(request, "/verify-age/callback?status=error&reason=underage");
      return NextResponse.redirect(redirectUrl, 302);
    }

    // Step 4: 중복 인증 체크 (같은 certNo)
    const existing = await prisma.ageVerification.findUnique({
      where: { certNo },
    });

    if (existing) {
      // 기존 토큰으로 쿠키 설정
      const redirectUrl = buildRedirectUrl(request, "/verify-age/callback?status=success");
      const response = NextResponse.redirect(redirectUrl, 302);
      response.cookies.set("age_token", existing.token, {
        maxAge: COOKIE_MAX_AGE,
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        path: "/",
      });
      return response;
    }

    // Step 5: 새 인증 토큰 생성 + DB 저장
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + COOKIE_MAX_AGE * 1000);

    const session = await auth();
    const userId = session?.user?.id || null;

    await prisma.ageVerification.create({
      data: {
        token,
        name: decrypted.userName,
        birthDate: decrypted.birthDay,
        phone: decrypted.phoneNo,
        sexCode: decrypted.sexCode || null,
        certNo,
        ci: decrypted.ci || null,
        di: decrypted.di || null,
        userId,
        expiresAt,
      },
    });

    // 로그인 상태면 User.ageVerified 업데이트
    if (userId) {
      await prisma.user.update({
        where: { id: userId },
        data: { ageVerified: new Date() },
      });
    }

    // Step 6: 쿠키 설정 + 성공 리다이렉트
    const redirectUrl = buildRedirectUrl(request, "/verify-age/callback?status=success");
    const response = NextResponse.redirect(redirectUrl, 302);
    response.cookies.set("age_token", token, {
      maxAge: COOKIE_MAX_AGE,
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("KCP callback error:", error);
    const redirectUrl = buildRedirectUrl(request, "/verify-age/callback?status=error&reason=server");
    return NextResponse.redirect(redirectUrl, 302);
  }
}
