import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { BANK_NAME, ACCOUNT_NUMBER, ACCOUNT_HOLDER } from "@/lib/constants/bank-account";
import { sendSms } from "@/lib/sms";
import { sendPushNotification } from "@/lib/push-notification";
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const { token } = await params;

    // Rate limiting: IP 기준 분당 5회
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const { success: rateLimitOk } = await checkRateLimit(`partner-confirm:${ip}`, 5, 60_000);
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

    // Find payment record
    const payment = await prisma.payment.findUnique({
      where: { orderId },
      include: { partner: true, user: { select: { phone: true } } },
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

    // 소유자 검증
    if (payment.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    // Verify token matches
    if (payment.partner?.paymentToken !== token) {
      return NextResponse.json({ error: "유효하지 않은 결제 토큰입니다" }, { status: 400 });
    }

    // C2 + H7 + M3: Transaction with payment update + token invalidation
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          method: "BANK_TRANSFER",
          bankName: BANK_NAME,
          accountNumber: ACCOUNT_NUMBER,
          receiptType: receiptType || "NONE",
          taxEmail: receiptType === "TAX_INVOICE" ? taxEmail : null,
          cashReceiptNo: receiptType === "CASH_RECEIPT" ? cashReceiptNo : null,
          cashReceiptType: receiptType === "CASH_RECEIPT" ? cashReceiptType : null,
          // status는 PENDING 유지 (관리자가 입금 확인 후 APPROVED로 변경)
        },
      });

      // H7: Invalidate payment token (one-time use)
      if (payment.partnerId) {
        await tx.partner.update({
          where: { id: payment.partnerId },
          data: { paymentToken: null },
        });
      }
    });

    revalidatePath("/partner");

    // SMS 입금안내 발송 (사장님에게, fire and forget)
    const partnerPhone = (payment.partner?.contactPhone || payment.user?.phone)?.replace(/[^0-9]/g, "");
    if (partnerPhone) {
      sendSms(
        partnerPhone,
        `[여시잡] 입금안내\n${BANK_NAME} ${ACCOUNT_NUMBER} (${ACCOUNT_HOLDER})\n금액: ${payment.amount.toLocaleString()}원\n\n입금 확인 후 제휴업체가 활성화됩니다.`,
        "[여시잡] 입금안내"
      ).catch(() => {});
    }

    // 관리자에게 알림 + 푸시 (fire and forget)
    const partnerName = payment.partner?.name || "알 수 없음";
    prisma.user
      .findMany({ where: { role: "ADMIN" }, select: { id: true } })
      .then((admins) => {
        if (admins.length > 0) {
          prisma.notification.createMany({
            data: admins.map((admin) => ({
              userId: admin.id,
              title: "새 입금 대기 (제휴업체)",
              message: `${partnerName}에서 결제를 신청했습니다 (${payment.amount.toLocaleString()}원)`,
              link: "/admin/payments",
            })),
          }).catch(() => {});
          admins.forEach((admin) => {
            sendPushNotification(admin.id, {
              title: "새 입금 대기 (제휴업체)",
              body: `${partnerName} (${payment.amount.toLocaleString()}원)`,
              url: "/admin/payments",
            }).catch(() => {});
          });
        }
      })
      .catch(() => {});

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
