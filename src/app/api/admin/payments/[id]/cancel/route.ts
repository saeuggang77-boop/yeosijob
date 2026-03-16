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
        { error: `입금대기 상태만 취소할 수 있습니다 (현재: ${payment.status})` },
        { status: 400 }
      );
    }

    // DB 취소 처리
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id },
        data: {
          status: "CANCELLED",
          failReason: "관리자 수동 취소",
        },
      });

      // 관련 광고도 취소 (PENDING_DEPOSIT 또는 PENDING_PAYMENT 상태인 경우)
      if (
        payment.adId &&
        payment.ad &&
        ["PENDING_DEPOSIT", "PENDING_PAYMENT"].includes(payment.ad.status)
      ) {
        await tx.ad.update({
          where: { id: payment.adId },
          data: { status: "CANCELLED" },
        });
      }
    });

    return NextResponse.json({
      message: "결제가 취소되었습니다",
      paymentId: id,
      adId: payment.adId,
    });
  } catch (error) {
    console.error("Payment cancel error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
