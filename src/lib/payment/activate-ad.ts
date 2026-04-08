import type { Prisma } from "@/generated/prisma/client";
import type { AdOptionId, AdProductId } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getActiveEvent, getBonusDays } from "@/lib/event";

type TransactionClient = Prisma.TransactionClient;

/** 결제 승인 시 광고 활성화에 필요한 Payment 타입 */
export interface PaymentForActivation {
  id: string;
  amount: number;
  adId: string | null;
  itemSnapshot: unknown;
  ad: {
    id: string;
    userId: string;
    title: string;
    durationDays: number;
    productId: string;
  } | null;
}

/** activateAd 반환값 */
export interface ActivationResult {
  durationDays: number;
  bonusDays: number;
  endDate: Date;
}

/**
 * 결제 승인 후 광고를 활성화하는 공통 함수.
 * admin/approve (관리자 수동 입금확인) 에서 호출.
 *
 * 반드시 prisma.$transaction 내부에서 호출해야 합니다.
 * payment.update(APPROVED)는 각 라우트에서 별도로 처리합니다 (카드정보 등 차이 때문).
 */
export async function activateAd(
  tx: TransactionClient,
  payment: PaymentForActivation,
  now: Date,
): Promise<ActivationResult | null> {
  if (!payment.adId || !payment.ad) return null;

  const snapshot = payment.itemSnapshot as Record<string, unknown>;
  const isUpgrade = snapshot?.type === "upgrade";
  const isRenew = snapshot?.type === "renew";

  // 기간 계산
  const durationDays = (isUpgrade || isRenew)
    ? (snapshot.duration as number)
    : (payment.ad.durationDays || 30);
  const event = await getActiveEvent();
  const bonusDays = (!isUpgrade && !isRenew) ? getBonusDays(durationDays, event) : 0;
  const endDate = new Date(now.getTime() + (durationDays + bonusDays) * 24 * 60 * 60 * 1000);

  if (isUpgrade || isRenew) {
    // 기존 옵션 삭제
    await tx.adOption.deleteMany({ where: { adId: payment.adId } });

    // 새 옵션 생성
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
    const newFeatures = snapshot.newFeatures as {
      autoJumpPerDay: number;
      manualJumpPerDay: number;
      maxEdits: number;
    };

    // 광고 업그레이드/연장
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
    // 일반 광고 활성화
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

  // 유료 결제 활성화 시 누적일수 갱신
  // activateAd는 admin approve(승인된 유료 결제)에서만 호출되므로 항상 유료임이 보장됨.
  // 이전에는 payment.ad.productId !== "FREE" 체크가 있었으나,
  // payment.ad는 트랜잭션 전 스냅샷이라 FREE→유료 첫 업그레이드 시 항상 "FREE"로 고정되어
  // 누적일수가 증가하지 않는 버그가 있었음.
  await tx.user.update({
    where: { id: payment.ad.userId },
    data: { totalPaidAdDays: { increment: durationDays } },
  });

  return { durationDays, bonusDays, endDate };
}

/**
 * 결제 완료 후 알림을 보내는 공통 함수.
 * 트랜잭션 밖에서 호출합니다.
 */
export async function sendPaymentNotification(
  payment: PaymentForActivation,
  title: string,
  result: ActivationResult,
): Promise<void> {
  if (!payment.ad) return;

  const { durationDays, bonusDays } = result;
  const periodText = bonusDays > 0
    ? `${durationDays}일 + 보너스 ${bonusDays}일 = 총 ${durationDays + bonusDays}일`
    : `${durationDays}일`;

  await prisma.notification.create({
    data: {
      userId: payment.ad.userId,
      title,
      message: `'${payment.ad.title}' 광고가 활성화되었습니다. 광고 기간: ${periodText}`,
      link: `/business/dashboard`,
    },
  });
}
