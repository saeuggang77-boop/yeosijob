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
    const {
      userId,
      userEmail,
      name,
      category,
      region,
      description,
      grade,
      monthlyPrice,
      address,
      highlight,
      tags,
      thumbnailUrl,
      detailImages,
      contactPhone,
      contactKakao,
      websiteUrl,
      businessHours,
    } = body;

    // Resolve userId from email if not provided directly
    let resolvedUserId = userId;
    if (!resolvedUserId && userEmail) {
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
      resolvedUserId = user.id;
    }

    // Validate required fields
    if (!resolvedUserId || !name || !category || !region || !description || !grade || !monthlyPrice) {
      return NextResponse.json({ error: "필수 필드가 누락되었습니다" }, { status: 400 });
    }

    // Generate payment token
    const paymentToken = crypto.randomUUID();

    // Create partner
    const partner = await prisma.partner.create({
      data: {
        userId: resolvedUserId,
        name,
        category,
        region,
        description,
        grade,
        monthlyPrice,
        address,
        highlight,
        tags,
        thumbnailUrl,
        detailImages,
        contactPhone,
        contactKakao,
        websiteUrl,
        businessHours,
        status: "PENDING_PAYMENT",
        durationDays: 30,
        paymentToken,
      },
    });

    // Create payment record
    const orderId = `PARTNER-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    await prisma.payment.create({
      data: {
        orderId,
        userId: resolvedUserId,
        amount: monthlyPrice,
        method: "CARD",
        status: "PENDING",
        itemSnapshot: {
          type: "partner",
          partnerId: partner.id,
          name: partner.name,
          grade: partner.grade,
          category: partner.category,
        },
        partnerId: partner.id,
      },
    });

    return NextResponse.json({ partner, paymentToken });
  } catch (error) {
    console.error("Partner creation error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
