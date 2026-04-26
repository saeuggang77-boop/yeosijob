import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { touchBusinessActivity } from "@/lib/business-activity";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const ad = await prisma.ad.findUnique({
    where: { id },
    include: {
      options: true,
      user: {
        select: {
          id: true,
          name: true,
          isVerifiedBiz: true,
        },
      },
      reviews: {
        where: { isHidden: false },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          rating: true,
          content: true,
          createdAt: true,
          user: { select: { name: true } },
        },
      },
      _count: {
        select: { reviews: { where: { isHidden: false } } },
      },
    },
  });

  if (!ad || ad.status !== "ACTIVE") {
    return NextResponse.json(
      { error: "광고를 찾을 수 없습니다" },
      { status: 404 }
    );
  }

  // 조회수 증가 + 일별 메트릭 기록
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  Promise.all([
    prisma.ad.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    }),
    prisma.adDailyMetric.upsert({
      where: { adId_date: { adId: id, date: today } },
      update: { views: { increment: 1 } },
      create: { adId: id, date: today, views: 1, clicks: 0 },
    }),
  ]).catch(() => {});

  return NextResponse.json(ad);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "BUSINESS") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    // 사장님 활동 시간 갱신 (광고 수정 = 명시적 활동, fire-and-forget)
    touchBusinessActivity(session.user.id).catch(() => {});

    const { id } = await params;

    const ad = await prisma.ad.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        status: true,
        editCount: true,
        maxEdits: true,
      },
    });

    if (!ad) {
      return NextResponse.json({ error: "광고를 찾을 수 없습니다" }, { status: 404 });
    }

    if (ad.userId !== session.user.id) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    if (ad.status !== "ACTIVE") {
      return NextResponse.json({ error: "게재중인 광고만 수정할 수 있습니다" }, { status: 400 });
    }

    // 수정 횟수 제한 체크
    if (ad.maxEdits > 0 && ad.editCount >= ad.maxEdits) {
      return NextResponse.json(
        { error: `수정 횟수를 초과했습니다 (최대 ${ad.maxEdits}회)` },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      title,
      salaryText,
      workHours,
      benefits,
      description,
      workEnvironment,
      safetyInfo,
      contactPhone,
      contactKakao,
      contactTelegram,
      address,
      addressDetail,
      locationHint,
      bannerTitle,
      bannerSubtitle,
      bannerTemplate,
      bannerColor,
      detailImages,
    } = body;

    // Validation
    if (!title || !salaryText || !description || !contactPhone) {
      return NextResponse.json({ error: "필수 항목을 모두 입력해주세요" }, { status: 400 });
    }

    const updated = await prisma.ad.update({
      where: { id },
      data: {
        title,
        salaryText,
        workHours: workHours || null,
        benefits: benefits || null,
        description,
        workEnvironment: workEnvironment || null,
        safetyInfo: safetyInfo || null,
        contactPhone: contactPhone.replace(/-/g, ""),
        contactKakao: contactKakao || null,
        contactTelegram: contactTelegram || null,
        address: address || null,
        addressDetail: addressDetail || null,
        locationHint: locationHint || null,
        ...(bannerTitle !== undefined && { bannerTitle: bannerTitle || null }),
        ...(bannerSubtitle !== undefined && { bannerSubtitle: bannerSubtitle || null }),
        ...(bannerTemplate !== undefined && { bannerTemplate }),
        ...(bannerColor !== undefined && { bannerColor }),
        ...(detailImages !== undefined && { detailImages: Array.isArray(detailImages) ? detailImages.slice(0, 10) : [] }),
        editCount: { increment: 1 },
      },
    });

    return NextResponse.json({
      message: "광고가 수정되었습니다",
    });
  } catch (error) {
    console.error("Ad update error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "BUSINESS") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    const { success: rateLimitOk } = await checkRateLimit(`ad-delete:${session.user.id}`, 5, 60_000);
    if (!rateLimitOk) {
      return NextResponse.json({ error: "너무 많은 요청입니다. 잠시 후 다시 시도해주세요" }, { status: 429 });
    }

    const { id } = await params;

    const ad = await prisma.ad.findUnique({
      where: { id },
      select: { id: true, userId: true, status: true, productId: true },
    });

    if (!ad) {
      return NextResponse.json({ error: "광고를 찾을 수 없습니다" }, { status: 404 });
    }

    if (ad.userId !== session.user.id) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    // 유료 ACTIVE 광고 → CANCELLED 상태 변경 (기간 환불 없음)
    if (ad.status === "ACTIVE" && ad.productId !== "FREE") {
      await prisma.ad.update({
        where: { id },
        data: { status: "CANCELLED" },
      });
      return NextResponse.json({ message: "광고가 내려졌습니다", action: "cancelled" });
    }

    // 그 외 (무료, 만료, 취소, 반려, 임시저장, 결제대기 등) → DB 삭제
    // Payment는 adId가 optional이므로 연결만 해제
    await prisma.$transaction(async (tx) => {
      await tx.payment.updateMany({
        where: { adId: id },
        data: { adId: null },
      });

      await tx.ad.delete({
        where: { id },
      });
    });

    return NextResponse.json({ message: "광고가 삭제되었습니다", action: "deleted" });
  } catch (error) {
    console.error("Ad delete error:", error);
    return NextResponse.json({ error: "삭제에 실패했습니다" }, { status: 500 });
  }
}
