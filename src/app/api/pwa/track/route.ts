import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

const VALID_PLATFORMS = ["ios", "android", "desktop"] as const;

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      // 비로그인은 조용히 무시 (fire-and-forget 호출이므로)
      return NextResponse.json({ ok: true });
    }

    const userId = session.user.id;

    // Rate limiting: 분당 5회
    const { success: rateLimitOk } = await checkRateLimit(
      `pwa-track:${userId}`,
      5,
      60_000
    );
    if (!rateLimitOk) {
      return NextResponse.json({ ok: true });
    }

    const body = await req.json();
    const { platform } = body;

    if (!platform || !VALID_PLATFORMS.includes(platform)) {
      return NextResponse.json({ ok: true });
    }

    await prisma.pwaInstall.upsert({
      where: {
        userId_platform: { userId, platform },
      },
      create: { userId, platform },
      update: { lastAccessAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PWA track error:", error);
    return NextResponse.json({ ok: true });
  }
}
