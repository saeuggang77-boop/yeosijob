import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "node:crypto";

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
      orderBy: [{ grade: "asc" }, { createdAt: "desc" }],
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
    const { userEmail, grade } = body;

    // Validate required fields (관리자는 이메일 + 등급만 필수)
    if (!userEmail || !grade) {
      return NextResponse.json({ error: "이메일과 등급은 필수입니다" }, { status: 400 });
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

    // 등급별 가격 자동 설정
    const GRADE_PRICES: Record<string, number> = { A: 3_000_000, B: 2_000_000, C: 1_000_000, D: 500_000 };
    const monthlyPrice = GRADE_PRICES[grade] || 500_000;

    // Generate payment token
    const paymentToken = crypto.randomUUID();

    // Create partner (업체 정보는 업체가 직접 입력)
    const partner = await prisma.partner.create({
      data: {
        userId: resolvedUserId,
        name: "미등록 업체",
        category: "OTHER",
        region: "SEOUL",
        description: "",
        grade,
        monthlyPrice,
        status: "PENDING_PAYMENT",
        durationDays: 30,
        paymentToken,
        isProfileComplete: false,
      },
    });

    // Payment는 결제 페이지에서 생성 (중복 방지)

    return NextResponse.json({ partner, paymentToken });
  } catch (error) {
    console.error("Partner creation error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
