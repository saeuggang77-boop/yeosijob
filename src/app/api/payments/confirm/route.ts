import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

const BANK_NAME = process.env.NEXT_PUBLIC_BANK_NAME || "토스뱅크";
const ACCOUNT_NUMBER = process.env.NEXT_PUBLIC_ACCOUNT_NUMBER || "";
const ACCOUNT_HOLDER = process.env.NEXT_PUBLIC_ACCOUNT_HOLDER || "여시잡";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "BUSINESS") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    // #29: Rate limiting (분당 5회)
    const { success: rateLimitOk } = await checkRateLimit(`payment-confirm:${session.user.id}`, 5, 60_000);
    if (!rateLimitOk) {
      return NextResponse.json({ error: "너무 많은 요청입니다. 잠시 후 다시 시도해주세요" }, { status: 429 });
    }

    const { orderId, receiptType, taxEmail, cashReceiptNo, cashReceiptType } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "필수 파라미터가 없습니다" },
        { status: 400 }
      );
    }

    // DB에서 결제 조회
    const payment = await prisma.payment.findUnique({
      where: { orderId },
      include: { ad: true },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "결제 정보를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    if (payment.userId !== session.user.id) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    if (payment.status !== "PENDING") {
      return NextResponse.json(
        { error: "이미 처리된 결제입니다" },
        { status: 400 }
      );
    }

    // 고유 입금자명 (orderId 마지막 4자리)
    const depositorName = orderId.slice(-4).toUpperCase();

    // Payment 업데이트: 계좌이체 정보 + 증빙서류 저장
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          method: "BANK_TRANSFER",
          bankName: BANK_NAME,
          accountNumber: ACCOUNT_NUMBER,
          depositorName,
          receiptType: receiptType || "NONE",
          taxEmail: receiptType === "TAX_INVOICE" ? taxEmail : null,
          cashReceiptNo: receiptType === "CASH_RECEIPT" ? cashReceiptNo : null,
          cashReceiptType: receiptType === "CASH_RECEIPT" ? cashReceiptType : null,
        },
      });

      // Ad 상태를 PENDING_DEPOSIT로 변경
      if (payment.adId) {
        await tx.ad.update({
          where: { id: payment.adId },
          data: { status: "PENDING_DEPOSIT" },
        });
      }
    });

    return NextResponse.json({
      message: "결제 신청이 완료되었습니다",
      adId: payment.adId,
      orderId,
      bankAccount: {
        bank: BANK_NAME,
        accountNumber: ACCOUNT_NUMBER,
        holder: ACCOUNT_HOLDER,
      },
    });
  } catch (error) {
    console.error("Payment confirm error:", error);
    return NextResponse.json({ error: "결제 신청에 실패했습니다" }, { status: 500 });
  }
}
