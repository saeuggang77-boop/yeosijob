import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "node:crypto";
import { calculatePartnerPrice, PARTNER_CATEGORY_PRICES } from "@/lib/constants/partners";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const partners = await prisma.partner.findMany({
      where: status ? { status: status as any } : undefined,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ partners });
  } catch (error) {
    console.error("Partners list error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { userEmail, category, durationDays = 30, isFree } = body;

    // Validate required fields
    if (!userEmail || !category) {
      return NextResponse.json({ error: "이메일과 업종은 필수입니다" }, { status: 400 });
    }

    if (!PARTNER_CATEGORY_PRICES[category]) {
      return NextResponse.json({ error: "유효하지 않은 업종입니다" }, { status: 400 });
    }

    // Resolve userId from email
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true, role: true },
    });
    if (!user) {
      return NextResponse.json({ error: "해당 이메일의 사용자를 찾을 수 없습니다" }, { status: 404 });
    }
    if (user.role !== "BUSINESS" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "사업자 계정만 제휴업체를 등록할 수 있습니다" }, { status: 400 });
    }
    const resolvedUserId = user.id;

    // 업종별 가격 계산
    const monthlyPrice = isFree ? 0 : calculatePartnerPrice(category, durationDays);

    if (isFree) {
      // 무료 입점: 결제 없이 바로 ACTIVE, 프로필 완성 대기
      const now = new Date();
      const partner = await prisma.partner.create({
        data: {
          userId: resolvedUserId,
          name: "미등록 업체",
          category,
          region: "SEOUL",
          description: "",
          monthlyPrice: 0,
          status: "ACTIVE",
          durationDays,
          startDate: now,
          endDate: null,
          isProfileComplete: false,
        },
      });
      revalidatePath("/partner");
      return NextResponse.json({ partner });
    }

    // 유료: 결제 링크 생성
    const paymentToken = crypto.randomUUID();

    const partner = await prisma.partner.create({
      data: {
        userId: resolvedUserId,
        name: "미등록 업체",
        category,
        region: "SEOUL",
        description: "",
        monthlyPrice,
        status: "PENDING_PAYMENT",
        durationDays,
        paymentToken,
        isProfileComplete: false,
      },
    });

    return NextResponse.json({ partner, paymentToken });
  } catch (error) {
    console.error("Partner creation error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
