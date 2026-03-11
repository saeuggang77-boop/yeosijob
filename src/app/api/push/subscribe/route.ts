import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Rate limiting: 분당 10회
  const { success: rateLimitOk } = await checkRateLimit(`push-sub:${userId}`, 10, 60_000);
  if (!rateLimitOk) {
    return NextResponse.json({ error: "너무 많은 요청입니다" }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { endpoint, keys } = body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { error: "endpoint와 keys는 필수입니다" },
        { status: 400 }
      );
    }

    // endpoint URL 형식 검증
    if (typeof endpoint !== "string" || endpoint.length > 2048 || !endpoint.startsWith("https://")) {
      return NextResponse.json({ error: "유효하지 않은 endpoint입니다" }, { status: 400 });
    }

    // keys 길이 검증 (base64 문자열)
    if (typeof keys.p256dh !== "string" || keys.p256dh.length > 512 ||
        typeof keys.auth !== "string" || keys.auth.length > 512) {
      return NextResponse.json({ error: "유효하지 않은 keys입니다" }, { status: 400 });
    }

    // Upsert: userId + endpoint 조합으로 중복 방지
    const subscription = await prisma.pushSubscription.upsert({
      where: {
        userId_endpoint: {
          userId,
          endpoint,
        },
      },
      update: {
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
      create: {
        userId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
    });

    return NextResponse.json({ subscription });
  } catch (error) {
    console.error("POST /api/push/subscribe error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
