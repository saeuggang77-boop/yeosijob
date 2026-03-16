import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

const BANK_NAME = process.env.NEXT_PUBLIC_BANK_NAME || "토스뱅크";
const ACCOUNT_NUMBER = process.env.NEXT_PUBLIC_ACCOUNT_NUMBER || "";
const ACCOUNT_HOLDER = process.env.NEXT_PUBLIC_ACCOUNT_HOLDER || "여시잡";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Rate limiting: IP 기준 분당 5회
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const { success: rateLimitOk } = await checkRateLimit(`partner-confirm:${ip}`, 5, 60_000);
    if (!rateLimitOk) {
      return NextResponse.json({ error: "너무 많은 요청입니다. 잠시 후 다시 시도해주세요" }, { status: 429 });
    }

    const body = await request.json();
    const { orderId, receiptType, taxEmail, cashReceiptNo, cashReceiptType } = body;

    if (!orderId) {
      return NextResponse.json({ error: "필수 필드가 누락되었습니다" }, { status: 400 });
    }

    // Find payment record
    const payment = await prisma.payment.findUnique({
      where: { orderId },
      include: { partner: true },
    });

    if (!payment) {
      return NextResponse.json({ error: "결제 정보를 찾을 수 없습니다" }, { status: 404 });
    }

    // Idempotency: 이미 처리된 결제
    if (payment.status === "APPROVED") {
      return NextResponse.json({
        success: true,
        message: "이미 처리된 결제입니다",
        partnerId: payment.partnerId,
      });
    }

    if (payment.status !== "PENDING") {
      return NextResponse.json({ error: "처리할 수 없는 결제 상태입니다" }, { status: 400 });
    }

    // Verify token matches
    if (payment.partner?.paymentToken !== token) {
      return NextResponse.json({ error: "유효하지 않은 결제 토큰입니다" }, { status: 400 });
    }

    // 고유 입금자명 (orderId 마지막 4자리)
    const depositorName = orderId.slice(-4).toUpperCase();

    // Payment 업데이트: 계좌이체 정보 + 증빙서류 저장
    await prisma.payment.update({
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
        // status는 PENDING 유지 (관리자가 입금 확인 후 APPROVED로 변경)
      },
    });

    revalidatePath("/partner");

    return NextResponse.json({
      success: true,
      message: "결제 신청이 완료되었습니다",
      partnerId: payment.partnerId,
      bankAccount: {
        bank: BANK_NAME,
        accountNumber: ACCOUNT_NUMBER,
        holder: ACCOUNT_HOLDER,
      },
    });
  } catch (error) {
    console.error("Partner payment confirmation error:", error);
    return NextResponse.json({ error: "결제 신청 실패" }, { status: 500 });
  }
}
