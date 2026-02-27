import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
        { error: `이미 처리된 결제입니다 (${payment.status})` },
        { status: 400 }
      );
    }

    const now = new Date();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const snapshot = payment.itemSnapshot as any;
    const isUpgrade = snapshot?.type === "upgrade";
    const isRenew = snapshot?.type === "renew";
    const durationDays = (isUpgrade || isRenew)
      ? snapshot.duration
      : (payment.ad?.durationDays || 30);
    const endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    await prisma.$transaction(async (tx) => {
      // Payment 승인
      await tx.payment.update({
        where: { id },
        data: {
          status: "APPROVED",
          paidAt: now,
        },
      });

      // Ad 활성화, 업그레이드 또는 연장
      if (payment.adId) {
        if (isUpgrade || isRenew) {
          // 기존 옵션 삭제
          await tx.adOption.deleteMany({
            where: { adId: payment.adId },
          });

          // 새 옵션 생성
          if (snapshot.options && Array.isArray(snapshot.options)) {
            for (const opt of snapshot.options) {
              await tx.adOption.create({
                data: {
                  adId: payment.adId,
                  optionId: opt.id,
                  value: opt.value,
                  durationDays: snapshot.duration,
                  startDate: now,
                  endDate,
                },
              });
            }
          }

          // #7: 광고 업그레이드/연장 (renew 시 totalAmount 교체, editCount 리셋, 점프 횟수 복원)
          await tx.ad.update({
            where: { id: payment.adId },
            data: {
              status: "ACTIVE",
              productId: snapshot.product.id,
              durationDays: snapshot.duration,
              totalAmount: isRenew ? payment.amount : { increment: payment.amount },
              autoJumpPerDay: snapshot.newFeatures.autoJumpPerDay,
              manualJumpPerDay: snapshot.newFeatures.manualJumpPerDay,
              maxEdits: snapshot.newFeatures.maxEdits,
              startDate: now,
              endDate,
              lastJumpedAt: now,
              manualJumpUsedToday: 0,
              editCount: 0,
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
            },
          });
        }

        // FREE가 아닌 유료 광고만 누적일수 갱신
        if (payment.ad && payment.ad.productId !== "FREE") {
          await tx.user.update({
            where: { id: payment.ad.userId },
            data: { totalPaidAdDays: { increment: durationDays } },
          });
        }
      }
    });

    // #5: Null pointer 수정 - ad가 없으면 알림 생성 건너뛰기
    if (payment.ad) {
      await prisma.notification.create({
        data: {
          userId: payment.ad.userId,
          title: "입금이 확인되었습니다",
          message: `'${payment.ad.title}' 광고가 활성화되었습니다. 광고 기간: ${durationDays}일`,
          link: `/business/dashboard`,
        },
      });
    }

    return NextResponse.json({
      message: "입금이 확인되었습니다",
      paymentId: id,
      adId: payment.adId,
      startDate: now.toISOString(),
      endDate: endDate.toISOString(),
    });
  } catch (error) {
    console.error("Payment approve error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
