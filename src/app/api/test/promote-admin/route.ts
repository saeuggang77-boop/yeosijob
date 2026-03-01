import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  // 프로덕션에서는 비밀 토큰 필요
  if (process.env.NODE_ENV === "production") {
    const authHeader = request.headers.get("x-e2e-secret");
    if (!authHeader || authHeader !== process.env.E2E_CLEANUP_SECRET) {
      return NextResponse.json({ error: "Not available" }, { status: 403 });
    }
  }

  const { email } = await request.json();

  const user = await prisma.user.update({
    where: { email },
    data: { role: "ADMIN" },
  });

  return NextResponse.json({ message: "Promoted to admin", userId: user.id });
}
