import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyBusinessNumber } from "@/lib/nts-api";
import { checkRateLimit } from "@/lib/rate-limit";
import { validateBusinessNumberFormat } from "@/lib/nts-verify";

// POST: Submit business number for verification (auto-verify via NTS API)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "BUSINESS") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    // Rate limiting (분당 3회)
    const rateLimitKey = `verify-business:${session.user.id}`;
    const rateLimitResult = await checkRateLimit(rateLimitKey, 3, 60 * 1000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요" },
        { status: 429 }
      );
    }

    const { businessNumber, ownerName } = await request.json();
    if (!businessNumber || businessNumber.replace(/-/g, "").length < 10) {
      return NextResponse.json({ error: "올바른 사업자등록번호를 입력해주세요" }, { status: 400 });
    }

    const cleaned = businessNumber.replace(/-/g, "");

    // 10자리 숫자 형식 검증
    if (!/^\d{10}$/.test(cleaned)) {
      return NextResponse.json(
        { error: "사업자등록번호는 10자리 숫자여야 합니다" },
        { status: 400 }
      );
    }

    // 체크섬 검증
    if (!validateBusinessNumberFormat(cleaned)) {
      return NextResponse.json(
        { error: "유효하지 않은 사업자등록번호입니다 (체크섬 오류)" },
        { status: 400 }
      );
    }

    // 블랙리스트 체크
    const blacklisted = await prisma.businessBlacklist.findUnique({
      where: { businessNumber: cleaned },
      select: { reason: true },
    });
    if (blacklisted) {
      return NextResponse.json(
        { error: "해당 사업자등록번호는 이용이 제한되었습니다. 문의사항은 고객센터로 연락해주세요." },
        { status: 403 }
      );
    }

    // 중복 체크 → 허용하되 관리자 알림
    const existingUsers = await prisma.user.findMany({
      where: {
        businessNumber: cleaned,
        isVerifiedBiz: true,
        id: { not: session.user.id },
      },
      select: { id: true, email: true, businessName: true, name: true },
    });

    if (existingUsers.length > 0) {
      const existingNames = existingUsers
        .map((u) => u.businessName || u.name || u.email)
        .join(", ");
      const formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5)}`;

      prisma.user
        .findMany({ where: { role: "ADMIN" }, select: { id: true } })
        .then((admins) => {
          if (admins.length > 0) {
            return prisma.notification.createMany({
              data: admins.map((admin) => ({
                userId: admin.id,
                title: "중복 사업자 인증",
                message: `사업자번호 ${formatted}이 중복 인증되었습니다. 기존: ${existingNames} / 신규: ${session.user.email || session.user.id}`,
                link: "/admin/verification",
              })),
            });
          }
        })
        .catch(() => {});
    }

    // 국세청 API로 자동 검증
    const ntsResult = await verifyBusinessNumber(cleaned, ownerName);

    if (ntsResult.valid) {
      // 영업중 — 자동 승인
      await prisma.user.update({
        where: { id: session.user.id },
        data: { businessNumber: cleaned, isVerifiedBiz: true, bizOwnerName: ownerName || null },
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
      data: { businessNumber: cleaned, bizOwnerName: ownerName || null },
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

    const [user, partnerCount] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { businessNumber: true, isVerifiedBiz: true, freeAdCredits: true },
      }),
      prisma.partner.count({
        where: { userId: session.user.id },
      }),
    ]);

    return NextResponse.json({
      businessNumber: user?.businessNumber || null,
      isVerified: user?.isVerifiedBiz || false,
      freeAdCredits: user?.freeAdCredits || 0,
      hasPartner: partnerCount > 0,
    });
  } catch (error) {
    console.error("Verification check error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
