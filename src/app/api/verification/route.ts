import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyBusinessNumber } from "@/lib/nts-api";

// POST: Submit business number for verification (auto-verify via NTS API)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "BUSINESS") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    const { businessNumber } = await request.json();
    if (!businessNumber || businessNumber.replace(/-/g, "").length < 10) {
      return NextResponse.json({ error: "올바른 사업자등록번호를 입력해주세요" }, { status: 400 });
    }

    const cleaned = businessNumber.replace(/-/g, "");

    // 국세청 API로 자동 검증
    const ntsResult = await verifyBusinessNumber(cleaned);

    if (ntsResult.valid) {
      // 영업중 — 자동 승인
      await prisma.user.update({
        where: { id: session.user.id },
        data: { businessNumber: cleaned, isVerifiedBiz: true },
      });

      // 기존 활성 광고에도 인증 배지 부여
      await prisma.ad.updateMany({
        where: { userId: session.user.id, status: "ACTIVE" },
        data: { isVerified: true },
      });

      return NextResponse.json({
        verified: true,
        message: "사업자 인증이 완료되었습니다.",
        status: ntsResult.status,
      });
    }

    // 휴업/폐업 — 거부
    if (ntsResult.statusCode === "02" || ntsResult.statusCode === "03") {
      return NextResponse.json({
        verified: false,
        message: `영업중인 사업자만 인증 가능합니다. (현재: ${ntsResult.status})`,
        status: ntsResult.status,
      }, { status: 400 });
    }

    // API 실패 또는 키 미설정 — 수동 플로우 fallback
    await prisma.user.update({
      where: { id: session.user.id },
      data: { businessNumber: cleaned },
    });

    return NextResponse.json({
      verified: false,
      message: "사업자등록번호가 제출되었습니다. 관리자 확인 후 인증 배지가 부여됩니다.",
      status: ntsResult.status,
    });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

// GET: Check verification status
export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { businessNumber: true, isVerifiedBiz: true },
    });

    const creditResult = await prisma.$queryRaw<{ freeAdCredits: number }[]>`
      SELECT "freeAdCredits" FROM "users" WHERE id = ${session.user.id}
    `;

    return NextResponse.json({
      businessNumber: user?.businessNumber || null,
      isVerified: user?.isVerifiedBiz || false,
      freeAdCredits: creditResult[0]?.freeAdCredits || 0,
    });
  } catch (error) {
    console.error("Verification check error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
