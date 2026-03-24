import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { calculatePartnerPrice } from "@/lib/constants/partners";
import { PaymentMethod } from "@/generated/prisma/client";
import crypto from "node:crypto";
import { sendPushNotification } from "@/lib/push-notification";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth check: BUSINESS role required
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "BUSINESS") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    // Rate limit: 5 requests per minute
    const rateLimitResult = await checkRateLimit(
      `partner-renew:${session.user.id}`,
      5,
      60_000
    );
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
        { status: 429 }
      );
    }

    const { id } = await params;

    // Find partner by id, verify ownership
    const partner = await prisma.partner.findUnique({
      where: { id },
    });

    if (!partner) {
      return NextResponse.json(
        { error: "제휴업체를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    if (partner.userId !== session.user.id) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    // Calculate remaining days
    const remainingDays = partner.endDate
      ? Math.ceil(
          (partner.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
      : 0;

    // Status validation: EXPIRED or (ACTIVE and remaining days < 30)
    if (
      partner.status !== "EXPIRED" &&
      !(partner.status === "ACTIVE" && remainingDays < 30)
    ) {
      return NextResponse.json(
        { error: "연장 가능한 상태가 아닙니다" },
        { status: 400 }
      );
    }

    // Use existing durationDays and category for pricing
    const amount = calculatePartnerPrice(
      partner.category,
      partner.durationDays
    );

    // Cancel existing PENDING payments for this partner
    await prisma.payment.updateMany({
      where: {
        partnerId: partner.id,
        status: "PENDING",
      },
      data: {
        status: "CANCELLED",
      },
    });

    // Generate payment token
    const paymentToken = crypto.randomUUID();

    // Create Payment record
    const payment = await prisma.payment.create({
      data: {
        userId: session.user.id,
        partnerId: partner.id,
        orderId: `YSJ-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
        amount,
        method: "BANK_TRANSFER" as PaymentMethod,
        status: "PENDING",
        itemSnapshot: {
          type: "partner_renew",
          category: partner.category,
          durationDays: partner.durationDays,
        },
      },
    });

    // Update partner with new paymentToken
    await prisma.partner.update({
      where: { id: partner.id },
      data: { paymentToken },
    });

    // Send admin notifications (fire and forget)
    prisma.user
      .findMany({ where: { role: "ADMIN" } })
      .then((admins) => {
        prisma.notification
          .createMany({
            data: admins.map((a) => ({
              userId: a.id,
              title: "새 입금 대기 (제휴업체 연장)",
              message: `${partner.name}에서 연장 결제를 신청했습니다 (${amount.toLocaleString()}원)`,
              link: "/admin/payments",
            })),
          })
          .catch(() => {});
        admins.forEach((a) =>
          sendPushNotification(a.id, {
            title: "새 입금 대기 (제휴업체 연장)",
            body: `${partner.name} (${amount.toLocaleString()}원)`,
            url: "/admin/payments",
          }).catch(() => {})
        );
      })
      .catch(() => {});

    return NextResponse.json({
      paymentToken,
      amount,
      partnerId: partner.id,
    });
  } catch (error) {
    console.error("Partner renew error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
