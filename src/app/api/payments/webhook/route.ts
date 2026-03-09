import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TOSS_API_URL, TOSS_SECRET_KEY } from "@/lib/toss/client";
import { getActiveEvent, getBonusDays } from "@/lib/event";
import type { AdOptionId, AdProductId } from "@/generated/prisma/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventType, data } = body;

    // Only handle deposit events
    if (eventType !== "PAYMENT_STATUS_CHANGED") {
      return NextResponse.json({ ok: true });
    }

    const { paymentKey, orderId, status } = data;

    if (status !== "DONE") {
      return NextResponse.json({ ok: true });
    }

    // Verify with Toss API
    const auth = Buffer.from(`${TOSS_SECRET_KEY}:`).toString("base64");
    const tossRes = await fetch(`${TOSS_API_URL}/payments/${paymentKey}`, {
      headers: { Authorization: `Basic ${auth}` },
    });

    if (!tossRes.ok) {
      console.error("Toss payment verification failed");
      return NextResponse.json({ error: "verification failed" }, { status: 400 });
    }

    const tossPayment = await tossRes.json();

    if (tossPayment.status !== "DONE") {
      return NextResponse.json({ ok: true }); // Not yet done
    }

    // Find payment by tossPaymentKey
    const payment = await prisma.payment.findUnique({
      where: { tossPaymentKey: paymentKey },
      include: { ad: true },
    });

    if (!payment) {
      console.error(`Webhook: payment not found for paymentKey ${paymentKey}`);
      return NextResponse.json({ ok: true });
    }

    // Already processed
    if (payment.status === "APPROVED") {
      return NextResponse.json({ ok: true });
    }

    const now = new Date();
    const snapshot = payment.itemSnapshot as Record<string, unknown>;
    const isUpgrade = snapshot?.type === "upgrade";
    const isRenew = snapshot?.type === "renew";
    const durationDays = (isUpgrade || isRenew)
      ? (snapshot.duration as number)
      : (payment.ad?.durationDays || 30);
    const event = await getActiveEvent();
    const bonusDays = (!isUpgrade && !isRenew) ? getBonusDays(durationDays, event) : 0;
    const endDate = new Date(now.getTime() + (durationDays + bonusDays) * 24 * 60 * 60 * 1000);

    // Same activation logic as admin approve
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "APPROVED",
          paidAt: now,
        },
      });

      if (payment.adId) {
        if (isUpgrade || isRenew) {
          await tx.adOption.deleteMany({ where: { adId: payment.adId } });
          if (snapshot.options && Array.isArray(snapshot.options)) {
            for (const opt of snapshot.options as Array<{ id: string; value: string }>) {
              await tx.adOption.create({
                data: {
                  adId: payment.adId,
                  optionId: opt.id as AdOptionId,
                  value: opt.value,
                  durationDays: snapshot.duration as number,
                  startDate: now,
                  endDate,
                },
              });
            }
          }
          const product = snapshot.product as { id: AdProductId };
          const newFeatures = snapshot.newFeatures as { autoJumpPerDay: number; manualJumpPerDay: number; maxEdits: number };
          await tx.ad.update({
            where: { id: payment.adId },
            data: {
              status: "ACTIVE",
              productId: product.id,
              durationDays: snapshot.duration as number,
              totalAmount: isRenew ? payment.amount : { increment: payment.amount },
              autoJumpPerDay: newFeatures.autoJumpPerDay,
              manualJumpPerDay: newFeatures.manualJumpPerDay,
              maxEdits: newFeatures.maxEdits,
              startDate: now,
              endDate,
              lastJumpedAt: now,
              manualJumpUsedToday: 0,
              editCount: 0,
              bonusDays: 0,
            },
          });
        } else {
          await tx.ad.update({
            where: { id: payment.adId },
            data: {
              status: "ACTIVE",
              startDate: now,
              endDate,
              lastJumpedAt: now,
              bonusDays,
            },
          });
        }

        if (payment.ad && payment.ad.productId !== "FREE") {
          await tx.user.update({
            where: { id: payment.ad.userId },
            data: { totalPaidAdDays: { increment: durationDays } },
          });
        }
      }
    });

    // Send notification to user
    if (payment.ad) {
      const periodText = bonusDays > 0
        ? `${durationDays}일 + 보너스 ${bonusDays}일 = 총 ${durationDays + bonusDays}일`
        : `${durationDays}일`;
      await prisma.notification.create({
        data: {
          userId: payment.ad.userId,
          title: "입금이 확인되었습니다",
          message: `'${payment.ad.title}' 광고가 활성화되었습니다. 광고 기간: ${periodText}`,
          link: `/business/dashboard`,
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
