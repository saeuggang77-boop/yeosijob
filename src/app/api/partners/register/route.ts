import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { calculatePartnerPrice, PARTNER_CATEGORY_PRICES, PARTNER_DURATION_OPTIONS } from "@/lib/constants/partners";
import { BANK_NAME, ACCOUNT_NUMBER, ACCOUNT_HOLDER } from "@/lib/constants/bank-account";
import crypto from "node:crypto";
import { z } from "zod";

const registerSchema = z.object({
  category: z.enum(["PLASTIC_SURGERY", "BEAUTY", "RENTAL", "FINANCE", "OTHER"]),
  durationDays: z.number().refine((v) => [30, 90, 180].includes(v), "유효하지 않은 기간"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== "BUSINESS" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "사장님 계정으로 로그인해주세요" }, { status: 401 });
    }

    // Rate limiting
    const { success: rateLimitOk } = await checkRateLimit(`partner-register:${session.user.id}`, 3, 60_000);
    if (!rateLimitOk) {
      return NextResponse.json({ error: "너무 많은 요청입니다. 잠시 후 다시 시도해주세요" }, { status: 429 });
    }

    const body = await request.json();
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "입력값이 올바르지 않습니다", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { category, durationDays } = validation.data;

    // 가격 계산
    const amount = calculatePartnerPrice(category, durationDays);
    if (amount <= 0) {
      return NextResponse.json({ error: "가격 계산 오류" }, { status: 400 });
    }

    // 이미 ACTIVE/PENDING 제휴업체가 있는지 확인
    const existingActive = await prisma.partner.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ["ACTIVE", "PENDING_PAYMENT"] },
        category: category as any,
      },
    });
    if (existingActive) {
      return NextResponse.json(
        { error: "이미 해당 업종에 등록된(또는 결제 대기 중인) 제휴업체가 있습니다" },
        { status: 409 }
      );
    }

    // Transaction: Partner + Payment 생성
    const paymentToken = crypto.randomUUID();
    const orderId = `PARTNER-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const result = await prisma.$transaction(async (tx) => {
      const partner = await tx.partner.create({
        data: {
          userId: session.user.id,
          name: "미등록 업체",
          category: category as any,
          region: "SEOUL",
          description: "",
          grade: null,
          monthlyPrice: PARTNER_CATEGORY_PRICES[category] || 500_000,
          durationDays,
          status: "PENDING_PAYMENT",
          paymentToken,
          isProfileComplete: false,
        },
      });

      const payment = await tx.payment.create({
        data: {
          orderId,
          userId: session.user.id,
          partnerId: partner.id,
          amount,
          method: "BANK_TRANSFER",
          status: "PENDING",
          bankName: BANK_NAME,
          accountNumber: ACCOUNT_NUMBER,
          receiptType: "NONE",
          itemSnapshot: {
            type: "partner",
            partnerId: partner.id,
            category,
            durationDays,
          },
        },
      });

      return { partner, payment };
    });

    // 관리자 알림은 결제 확인(confirm) 시점에 발송 (등록 시점에는 미발송)

    return NextResponse.json({
      success: true,
      partnerId: result.partner.id,
      orderId: result.payment.orderId,
      amount,
      bankAccount: {
        bank: BANK_NAME,
        accountNumber: ACCOUNT_NUMBER,
        holder: ACCOUNT_HOLDER,
      },
    });
  } catch (error) {
    console.error("Partner register error:", error);
    return NextResponse.json({ error: "제휴업체 등록에 실패했습니다" }, { status: 500 });
  }
}
