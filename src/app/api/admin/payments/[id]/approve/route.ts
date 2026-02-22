import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    const { id } = await params;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { ad: true },
    });

    if (!payment) {
      return NextResponse.json({ error: "결제를 찾을 수 없습니다" }, { status: 404 });
    }

    if (payment.status !== "PENDING") {
      return NextResponse.json(
        { error: `이미 처리된 결제입니다 (${payment.status})` },
        { status: 400 }
      );
    }

    const now = new Date();
    const durationDays = payment.ad?.durationDays || 30;
    const endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    await prisma.$transaction(async (tx) => {
      // Payment 승인
      await tx.payment.update({
        where: { id },
        data: {
          status: "APPROVED",
          paidAt: now,
        },
      });

      // Ad 활성화
      if (payment.adId) {
        await tx.ad.update({
          where: { id: payment.adId },
          data: {
            status: "ACTIVE",
            startDate: now,
            endDate,
            lastJumpedAt: now,
          },
        });
      }
    });

    return NextResponse.json({
      message: "입금이 확인되었습니다",
      paymentId: id,
      adId: payment.adId,
      startDate: now.toISOString(),
      endDate: endDate.toISOString(),
    });
  } catch (error) {
    console.error("Payment approve error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
