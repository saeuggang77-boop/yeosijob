import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  // Rate limit: IP 기준 1분에 3회
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const { success } = checkRateLimit(`find-email:${ip}`, 3, 60_000);
  if (!success) {
    return NextResponse.json(
      { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
      { status: 429 }
    );
  }

  const { phone } = await req.json();
  if (!phone || typeof phone !== "string") {
    return NextResponse.json(
      { error: "전화번호를 입력해주세요" },
      { status: 400 }
    );
  }

  // 숫자만 추출
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  if (cleanPhone.length < 10 || cleanPhone.length > 11) {
    return NextResponse.json(
      { error: "올바른 전화번호를 입력해주세요" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findFirst({
    where: { phone: cleanPhone },
    select: { email: true },
  });

  if (!user?.email) {
    return NextResponse.json(
      { error: "해당 전화번호로 가입된 계정이 없습니다" },
      { status: 404 }
    );
  }

  // 이메일 마스킹: a***@gmail.com
  const [local, domain] = user.email.split("@");
  const maskedLocal = local.length <= 1 ? local + "***" : local[0] + "***";
  const maskedEmail = `${maskedLocal}@${domain}`;

  return NextResponse.json({ maskedEmail });
}
