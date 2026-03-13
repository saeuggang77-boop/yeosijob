import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TOSS_API_URL, TOSS_SECRET_KEY } from "@/lib/toss/client";

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

    // 토스 결제 취소 (paymentKey가 있는 경우 = 가상계좌 발급된 경우)
    if (payment.tossPaymentKey && TOSS_SECRET_KEY) {
      try {
        const auth = Buffer.from(`${TOSS_SECRET_KEY}:`).toString("base64");
        const res = await fetch(
          `${TOSS_API_URL}/payments/${payment.tossPaymentKey}/cancel`,
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${auth}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ cancelReason: "관리자 취소" }),
          }
        );

        if (!res.ok) {
          const error = await res.json();
          // 이미 만료된 가상계좌는 토스에서 에러 반환 → DB만 취소 진행
          console.log("[결제 취소] 토스 취소 응답:", error.code, error.message);
        }
      } catch (e) {
        console.error("[결제 취소] 토스 API 호출 실패:", e);
      }
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
