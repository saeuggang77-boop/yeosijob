import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCronAuth } from "@/lib/utils/cron-auth";
import { sendSms } from "@/lib/sms";

const FREE_EXPIRY_DAYS = 90;
const NOTIFY_DAYS_BEFORE = 7;
const SMS_BATCH_DELAY_MS = 1000;

/**
 * 무료광고 미활동 만료 D-7 SMS 알림 cron - 매일 1회 실행 (KST 10시 = UTC 01시)
 *
 * 동작:
 *  - 사장님(BUSINESS) 중 무료광고(ACTIVE FREE) 보유 + 마지막 활동이 83일 이상 ~ 90일 미만
 *  - lastFreeExpiryNotifiedAt 90일 이내면 skip (중복 발송 방지)
 *  - 사장당 1통만 (광고 N건이면 본문에 묶음 표기)
 *  - SMS 발송번호: 가장 빨리 만료될 무료광고의 contactPhone (없으면 user.phone fallback)
 *
 * 드라이런 모드: env FREE_EXPIRY_DRY_RUN=1 → 발송 대상자만 로그, 실제 SMS 발송 X
 */
export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dryRun = process.env.FREE_EXPIRY_DRY_RUN === "1";

  try {
    const now = new Date();
    const warningCutoff = new Date(
      now.getTime() - (FREE_EXPIRY_DAYS - NOTIFY_DAYS_BEFORE) * 24 * 60 * 60 * 1000
    ); // 83일 전
    const expiryCutoff = new Date(now.getTime() - FREE_EXPIRY_DAYS * 24 * 60 * 60 * 1000); // 90일 전
    const recentNotifyCutoff = new Date(now.getTime() - FREE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    // 대상자: 활동 83일 경과 + 90일 미경과 + (미발송 OR 90일 전 발송) + 활성 무료광고 보유
    // 시드 데이터(isGhost) + 운영자 스탭(isStaff) 제외
    const targets = await prisma.user.findMany({
      where: {
        role: "BUSINESS",
        isActive: true,
        isGhost: false,
        isStaff: false,
        lastBusinessActivityAt: { lt: warningCutoff, gte: expiryCutoff },
        OR: [
          { lastFreeExpiryNotifiedAt: null },
          { lastFreeExpiryNotifiedAt: { lt: recentNotifyCutoff } },
        ],
        ads: {
          some: { status: "ACTIVE", productId: "FREE" },
        },
      },
      select: {
        id: true,
        phone: true,
        ads: {
          where: { status: "ACTIVE", productId: "FREE" },
          orderBy: { createdAt: "asc" },
          select: { id: true, businessName: true, contactPhone: true },
        },
      },
    });

    const results = {
      targetCount: targets.length,
      sent: 0,
      skipped: 0,
      failed: 0,
      dryRun,
      details: [] as Array<{ userId: string; phone: string; adCount: number; status: string }>,
    };

    for (const user of targets) {
      const adCount = user.ads.length;
      const firstAd = user.ads[0];
      const phone = (firstAd?.contactPhone || user.phone || "").replace(/[^0-9]/g, "");

      if (!phone || phone.length < 10) {
        results.skipped++;
        results.details.push({
          userId: user.id,
          phone: phone || "(없음)",
          adCount,
          status: "skipped:no-phone",
        });
        continue;
      }

      const text = [
        "[여시잡] 안녕하세요 사장님 😊",
        "",
        `등록하신 무료광고 ${adCount}건이 90일간 활동이 없어 7일 뒤 노출이 중지됩니다.`,
        "",
        "✅ 사이트 방문 한 번이면 자동 연장",
        "✅ 추가 비용 없음",
        "",
        "그동안 사이트도 많이 좋아졌으니 한 번 둘러보세요!",
        "👉 yeosijob.com/business",
      ].join("\n");

      if (dryRun) {
        results.sent++;
        results.details.push({
          userId: user.id,
          phone,
          adCount,
          status: "dry-run",
        });
        continue;
      }

      const smsResult = await sendSms(phone, text, "[여시잡] 광고 만료 안내");

      if (smsResult.success) {
        await prisma.user.update({
          where: { id: user.id },
          data: { lastFreeExpiryNotifiedAt: new Date() },
        });
        results.sent++;
        results.details.push({ userId: user.id, phone, adCount, status: "sent" });
      } else {
        results.failed++;
        results.details.push({
          userId: user.id,
          phone,
          adCount,
          status: `failed:${smsResult.error?.slice(0, 50) || "unknown"}`,
        });
      }

      // SOLAPI rate limit 회피용 1초 간격
      await new Promise((r) => setTimeout(r, SMS_BATCH_DELAY_MS));
    }

    return NextResponse.json({
      message: "Notify-free-expiry completed",
      ...results,
    });
  } catch (error) {
    console.error("Notify-free-expiry cron error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
