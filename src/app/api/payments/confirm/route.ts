import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { BANK_NAME, ACCOUNT_NUMBER, ACCOUNT_HOLDER } from "@/lib/constants/bank-account";
import { z } from "zod";

const receiptSchema = z.object({
  orderId: z.string(),
  receiptType: z.enum(["TAX_INVOICE", "CASH_RECEIPT", "NONE"]),
  taxEmail: z.string().email().optional(),
  cashReceiptNo: z.string().regex(/^\d{10,13}$/).optional(),
  cashReceiptType: z.enum(["PHONE", "BIZ"]).optional(),
}).refine(
  (data) => {
    if (data.receiptType === "TAX_INVOICE") {
      return !!data.taxEmail;
    }
    return true;
  },
  { message: "세금계산서 선택 시 이메일은 필수입니다", path: ["taxEmail"] }
).refine(
  (data) => {
    if (data.receiptType === "CASH_RECEIPT") {
      return !!data.cashReceiptNo && !!data.cashReceiptType;
    }
    return true;
  },
  { message: "현금영수증 선택 시 발급번호와 타입은 필수입니다", path: ["cashReceiptNo"] }
);

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

    const body = await request.json();

    // M3: zod validation for receipt data
    const validationResult = receiptSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "입력값이 올바르지 않습니다", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { orderId, receiptType, taxEmail, cashReceiptNo, cashReceiptType } = validationResult.data;

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

      // Ad 상태를 PENDING_DEPOSIT로 변경 (업그레이드 중인 ACTIVE 광고는 유지)
      if (payment.adId && payment.ad?.status !== "ACTIVE") {
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
