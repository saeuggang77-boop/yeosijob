import { NextRequest, NextResponse } from "next/server";
import { getTotalBlobUsage, BLOB_QUOTA_BYTES } from "@/lib/blob-helpers";
import { prisma } from "@/lib/prisma";
import { verifyCronAuth } from "@/lib/utils/cron-auth";

/**
 * Vercel Blob 용량 모니터링 Cron Job
 * Vercel Cron에서 주기적으로 호출 (예: 매일 1회)
 *
 * vercel.json 설정 예시:
 * {
 *   "crons": [{
 *     "path": "/api/cron/check-blob-usage",
 *     "schedule": "0 9 * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    if (!verifyCronAuth(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const usageBytes = await getTotalBlobUsage();
    const usagePercent = Math.round((usageBytes / BLOB_QUOTA_BYTES) * 100);

    // Get all admin users
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    if (admins.length === 0) {
      return NextResponse.json({
        message: "No admins found",
        usageBytes,
        usagePercent,
      });
    }

    // 80% 도달 시 경고
    if (usagePercent >= 80 && usagePercent < 90) {
      await Promise.all(
        admins.map((admin) =>
          prisma.notification.create({
            data: {
              userId: admin.id,
              title: "⚠️ Blob 저장소 용량 경고",
              message: `현재 사용량: ${usagePercent}% (${(usageBytes / 1024 / 1024).toFixed(1)}MB / ${BLOB_QUOTA_BYTES / 1024 / 1024}MB)`,
              link: "/admin/blob-usage",
            },
          })
        )
      );
    }

    // 90% 도달 시 긴급 경고
    if (usagePercent >= 90) {
      await Promise.all(
        admins.map((admin) =>
          prisma.notification.create({
            data: {
              userId: admin.id,
              title: "🚨 Blob 저장소 용량 위험",
              message: `현재 사용량: ${usagePercent}% (${(usageBytes / 1024 / 1024).toFixed(1)}MB / ${BLOB_QUOTA_BYTES / 1024 / 1024}MB). 즉시 조치가 필요합니다!`,
              link: "/admin/blob-usage",
            },
          })
        )
      );
    }

    return NextResponse.json({
      success: true,
      usageBytes,
      usagePercent,
      adminNotified: usagePercent >= 80,
    });
  } catch (error) {
    console.error("Blob usage check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
