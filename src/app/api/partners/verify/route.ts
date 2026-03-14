import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyBusinessNumber, validateBusinessNumberFormat } from "@/lib/nts-verify";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    // Rate limiting
    const rateLimitKey = `verify-partner:${session.user.id}`;
    const rl = await checkRateLimit(rateLimitKey, 3, 60 * 1000);
    if (!rl.success) {
      return NextResponse.json({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요" }, { status: 429 });
    }

    const { partnerId, businessNumber, ownerName } = await req.json();

    if (!partnerId || !businessNumber || !ownerName) {
      return NextResponse.json({ error: "사업자등록번호와 대표자명을 입력해주세요" }, { status: 400 });
    }

    // 소유권 검증
    const partner = await prisma.partner.findFirst({
      where: { id: partnerId, userId: session.user.id },
      select: { id: true, isVerifiedBiz: true },
    });
    if (!partner) {
      return NextResponse.json({ error: "업체를 찾을 수 없습니다" }, { status: 404 });
    }

    const cleaned = businessNumber.replace(/[^0-9]/g, "");

    if (!/^\d{10}$/.test(cleaned)) {
      return NextResponse.json({ error: "사업자등록번호는 10자리 숫자여야 합니다" }, { status: 400 });
    }

    if (!validateBusinessNumberFormat(cleaned)) {
      return NextResponse.json({ error: "유효하지 않은 사업자등록번호입니다 (체크섬 오류)" }, { status: 400 });
    }

    // 블랙리스트
    const blacklisted = await prisma.businessBlacklist.findUnique({
      where: { businessNumber: cleaned },
      select: { reason: true },
    });
    if (blacklisted) {
      return NextResponse.json({ error: "해당 사업자등록번호는 이용이 제한되었습니다." }, { status: 403 });
    }

    // 중복 체크 → 관리자 알림
    const existingPartners = await prisma.partner.findMany({
      where: { businessNumber: cleaned, isVerifiedBiz: true, id: { not: partnerId } },
      select: { id: true, name: true },
    });
    if (existingPartners.length > 0) {
      const formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5)}`;
      const existingNames = existingPartners.map(p => p.name).join(", ");
      prisma.user
        .findMany({ where: { role: "ADMIN" }, select: { id: true } })
        .then(admins => {
          if (admins.length > 0) {
            return prisma.notification.createMany({
              data: admins.map(admin => ({
                userId: admin.id,
                title: "중복 제휴업체 사업자 인증",
                message: `사업자번호 ${formatted} 중복 인증. 기존: ${existingNames} / 신규: partnerId ${partnerId}`,
                link: "/admin/partners",
              })),
            });
          }
        })
        .catch(() => {});
    }

    // 국세청 진위확인 API
    const result = await verifyBusinessNumber(cleaned, ownerName);

    if (!result.valid) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    // 인증 성공 → DB 업데이트
    await prisma.partner.update({
      where: { id: partnerId },
      data: {
        businessNumber: cleaned,
        bizOwnerName: ownerName,
        isVerifiedBiz: true,
      },
    });

    return NextResponse.json({ verified: true, message: "사업자 인증이 완료되었습니다" });
  } catch (error) {
    console.error("Partner verification error:", error);
    return NextResponse.json({ error: "인증 처리 중 오류가 발생했습니다" }, { status: 500 });
  }
}
