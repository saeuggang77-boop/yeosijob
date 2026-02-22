import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  // 조회수 증가
  await prisma.ad.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  });

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

    if (ad.editCount >= ad.maxEdits) {
      return NextResponse.json(
        { error: `수정 가능 횟수를 초과했습니다 (${ad.maxEdits}회)` },
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
      contactPhone,
      contactKakao,
      address,
      addressDetail,
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
        contactPhone: contactPhone.replace(/-/g, ""),
        contactKakao: contactKakao || null,
        address: address || null,
        addressDetail: addressDetail || null,
        editCount: { increment: 1 },
      },
    });

    return NextResponse.json({
      message: "광고가 수정되었습니다",
      editCount: updated.editCount,
      maxEdits: updated.maxEdits,
    });
  } catch (error) {
    console.error("Ad update error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
