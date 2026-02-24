import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const PORTONE_API_SECRET = process.env.PORTONE_API_SECRET || "";
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30일 (초)

function calculateAge(birthDateStr: string): number {
  // birthDateStr: "YYYY-MM-DD" or "YYYYMMDD"
  const normalized = birthDateStr.replace(/-/g, "");
  const year = parseInt(normalized.substring(0, 4), 10);
  const month = parseInt(normalized.substring(4, 6), 10);
  const day = parseInt(normalized.substring(6, 8), 10);

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identityVerificationId } = body;

    if (!identityVerificationId) {
      return NextResponse.json(
        { error: "인증 ID가 필요합니다" },
        { status: 400 }
      );
    }

    if (!PORTONE_API_SECRET) {
      return NextResponse.json(
        { error: "본인인증 서비스가 설정되지 않았습니다" },
        { status: 503 }
      );
    }

    // PortOne V2 API로 인증 결과 조회
    const portoneRes = await fetch(
      `https://api.portone.io/identity-verifications/${encodeURIComponent(identityVerificationId)}`,
      {
        headers: {
          Authorization: `PortOne ${PORTONE_API_SECRET}`,
        },
      }
    );

    if (!portoneRes.ok) {
      console.error("PortOne API error:", await portoneRes.text().catch(() => ""));
      return NextResponse.json(
        { error: "본인인증 결과를 확인할 수 없습니다" },
        { status: 400 }
      );
    }

    const data = await portoneRes.json();

    if (data.status !== "VERIFIED") {
      return NextResponse.json(
        { error: "본인인증이 완료되지 않았습니다" },
        { status: 400 }
      );
    }

    const customer = data.verifiedCustomer;
    if (!customer?.birthDate) {
      return NextResponse.json(
        { error: "인증 정보를 확인할 수 없습니다" },
        { status: 400 }
      );
    }

    // 만 19세 이상 확인
    const age = calculateAge(customer.birthDate);
    if (age < 19) {
      return NextResponse.json(
        { error: "만 19세 미만은 이용할 수 없습니다", underage: true },
        { status: 403 }
      );
    }

    // 중복 인증 체크
    const existing = await prisma.ageVerification.findUnique({
      where: { impUid: identityVerificationId },
    });

    if (existing) {
      const response = NextResponse.json({
        message: "이미 인증되었습니다",
        verified: true,
      });
      response.cookies.set("age_token", existing.token, {
        maxAge: COOKIE_MAX_AGE,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });
      return response;
    }

    // 인증 토큰 생성 + DB 저장
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + COOKIE_MAX_AGE * 1000);

    const session = await auth();
    const userId = session?.user?.id || null;

    await prisma.ageVerification.create({
      data: {
        token,
        name: customer.name || "",
        birthDate: customer.birthDate.replace(/-/g, ""),
        phone: customer.phoneNumber || "",
        carrier: customer.carrier || null,
        impUid: identityVerificationId,
        userId,
        expiresAt,
      },
    });

    if (userId) {
      await prisma.user.update({
        where: { id: userId },
        data: { ageVerified: new Date() },
      });
    }

    const response = NextResponse.json({
      message: "본인인증이 완료되었습니다",
      verified: true,
    });

    response.cookies.set("age_token", token, {
      maxAge: COOKIE_MAX_AGE,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Age verification error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
