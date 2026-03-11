import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const partner = await prisma.partner.findFirst({
      where: {
        paymentToken: token,
        status: { in: ["PENDING_PAYMENT", "EXPIRED"] },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!partner) {
      return NextResponse.json({ error: "결제 정보를 찾을 수 없습니다" }, { status: 404 });
    }

    return NextResponse.json({
      partner: {
        id: partner.id,
        name: partner.name,
        grade: partner.grade,
        category: partner.category,
        amount: partner.monthlyPrice,
        status: partner.status,
      },
    });
  } catch (error) {
    console.error("Partner payment info error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const partner = await prisma.partner.findFirst({
      where: {
        paymentToken: token,
        status: { in: ["PENDING_PAYMENT", "EXPIRED"] },
      },
    });

    if (!partner) {
      return NextResponse.json({ error: "결제 정보를 찾을 수 없습니다" }, { status: 404 });
    }

    // Check if payment already exists in PENDING status
    let payment = await prisma.payment.findFirst({
      where: {
        partnerId: partner.id,
        status: "PENDING",
      },
    });

    // Create new payment if not exists
    if (!payment) {
      const orderId = `PARTNER-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      payment = await prisma.payment.create({
        data: {
          orderId,
          userId: partner.userId,
          amount: partner.monthlyPrice,
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
    }

    return NextResponse.json({
      orderId: payment.orderId,
      amount: payment.amount,
    });
  } catch (error) {
    console.error("Partner payment creation error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
