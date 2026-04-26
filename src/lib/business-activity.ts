import { prisma } from "@/lib/prisma";

const THROTTLE_MS = 60 * 60 * 1000; // 1시간
const RECOVERY_WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // 30일

/**
 * 사장님 활동 시간 갱신 + 30일 이내 EXPIRED 무료광고 자동 복구.
 * - 1시간 throttle: 직전 갱신이 1시간 이내면 skip하여 DB write 부담 최소화
 * - BUSINESS 역할이 아닌 경우 호출해도 무해 (조건 분기 후 즉시 반환)
 * - EXPIRED 무료광고가 만료된 지 30일 이내면 ACTIVE로 자동 복구 + 사이트 알림 1건 생성
 * - fire-and-forget 방식 (실패해도 요청 흐름 막지 않음)
 */
export async function touchBusinessActivity(userId: string): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, lastBusinessActivityAt: true },
    });

    if (!user || user.role !== "BUSINESS") return;

    const last = user.lastBusinessActivityAt?.getTime() || 0;
    if (Date.now() - last < THROTTLE_MS) return;

    await prisma.user.update({
      where: { id: userId },
      data: { lastBusinessActivityAt: new Date() },
    });

    // 30일 이내 EXPIRED 무료광고 자동 복구
    const recoveryCutoff = new Date(Date.now() - RECOVERY_WINDOW_MS);
    const recovered = await prisma.ad.updateMany({
      where: {
        userId,
        status: "EXPIRED",
        productId: "FREE",
        updatedAt: { gte: recoveryCutoff },
      },
      data: { status: "ACTIVE" },
    });

    if (recovered.count > 0) {
      await prisma.notification
        .create({
          data: {
            userId,
            title: "광고가 자동 복구되었어요 🎉",
            message: `방치되었던 무료광고 ${recovered.count}건이 자동으로 다시 노출됩니다. 사이트 방문해주셔서 감사합니다 😊`,
            link: "/business/dashboard",
          },
        })
        .catch(() => {});
    }
  } catch (err) {
    console.error("touchBusinessActivity error:", err);
  }
}
