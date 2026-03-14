import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyBusinessNumber, validateBusinessNumberFormat } from "@/lib/nts-verify";

export async function POST(req: NextRequest) {
  try {
    // 1. 인증 확인
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    // 2. 사업자 계정인지 확인
    if (session.user.role !== "BUSINESS") {
      return NextResponse.json(
        { error: "사업자 계정만 사용할 수 있습니다" },
        { status: 403 }
      );
    }

    // 3. Rate limiting (분당 3회)
    const rateLimitKey = `verify-business:${session.user.id}`;
    const rateLimitResult = await checkRateLimit(rateLimitKey, 3, 60 * 1000);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요" },
        { status: 429 }
      );
    }

    // 4. 요청 본문 파싱
    const body = await req.json();
    const { businessNumber, ownerName } = body;

    if (!businessNumber || typeof businessNumber !== "string") {
      return NextResponse.json(
        { error: "사업자등록번호를 입력해주세요" },
        { status: 400 }
      );
    }

    // 5. 숫자만 추출 (하이픈 제거)
    const bizNum = businessNumber.replace(/[^0-9]/g, "");

    // 6. 10자리 숫자 형식 검증
    if (!/^\d{10}$/.test(bizNum)) {
      return NextResponse.json(
        { error: "사업자등록번호는 10자리 숫자여야 합니다" },
        { status: 400 }
      );
    }

    // 7. 체크섬 검증
    if (!validateBusinessNumberFormat(bizNum)) {
      return NextResponse.json(
        { error: "유효하지 않은 사업자등록번호입니다 (체크섬 오류)" },
        { status: 400 }
      );
    }

    // 8. 중복 사업자번호 체크 → 허용하되 관리자 알림
    const existingUsers = await prisma.user.findMany({
      where: {
        businessNumber: bizNum,
        isVerifiedBiz: true,
        id: { not: session.user.id },
      },
      select: { id: true, email: true, businessName: true, name: true },
    });

    if (existingUsers.length > 0) {
      // 중복이지만 차단하지 않고 관리자에게 알림
      const existingNames = existingUsers
        .map((u) => u.businessName || u.name || u.email)
        .join(", ");
      const formatted = `${bizNum.slice(0, 3)}-${bizNum.slice(3, 5)}-${bizNum.slice(5)}`;

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

    // 8-2. 블랙리스트 체크
    const blacklisted = await prisma.businessBlacklist.findUnique({
      where: { businessNumber: bizNum },
      select: { reason: true },
    });

    if (blacklisted) {
      return NextResponse.json(
        { error: "해당 사업자등록번호는 이용이 제한되었습니다. 문의사항은 고객센터로 연락해주세요." },
        { status: 403 }
      );
    }

    // 9. 국세청 API로 실제 상태 확인
    const verifyResult = await verifyBusinessNumber(bizNum, ownerName);

    if (!verifyResult.valid) {
      return NextResponse.json(
        { error: verifyResult.message },
        { status: 400 }
      );
    }

    // 10. 성공 시 DB 업데이트
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        businessNumber: bizNum,
        isVerifiedBiz: true,
        bizOwnerName: ownerName || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "사업자 인증이 완료되었습니다",
    });
  } catch (error) {
    console.error("Business verification error:", error);
    return NextResponse.json(
      { error: "인증 처리 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
