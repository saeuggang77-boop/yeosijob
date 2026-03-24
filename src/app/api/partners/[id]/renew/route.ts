import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculatePartnerPrice } from "@/lib/constants/partners";
import crypto from "node:crypto";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Find partner and verify ownership
    const partner = await prisma.partner.findUnique({
      where: { id },
    });

    if (!partner) {
      return NextResponse.json({ error: "파트너를 찾을 수 없습니다" }, { status: 404 });
    }

    // Check if user is owner or admin
    if (partner.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    // 기존 PENDING 결제가 있으면 취소 후 새로 생성
    let paymentToken = "";

    await prisma.$transaction(async (tx) => {
      await tx.payment.updateMany({
        where: {
          partnerId: partner.id,
          status: "PENDING",
        },
        data: { status: "CANCELLED" },
      });

      // Generate new payment token
      paymentToken = crypto.randomUUID();

      // Update partner with new token
      await tx.partner.update({
        where: { id },
        data: { paymentToken },
      });

      // Create new payment record
      const orderId = `PARTNER-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      await tx.payment.create({
        data: {
          orderId,
          userId: partner.userId,
          amount: calculatePartnerPrice(partner.category, partner.durationDays),
          method: "BANK_TRANSFER",
          status: "PENDING",
          itemSnapshot: {
            type: "partner_renewal",
            partnerId: partner.id,
            name: partner.name,
            category: partner.category,
          },
          partnerId: partner.id,
        },
      });
    });

    return NextResponse.json({ paymentToken });
  } catch (error) {
    console.error("Partner renewal error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
