import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  // 프로덕션에서는 완전히 비활성화
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { email } = await request.json();

  const user = await prisma.user.update({
    where: { email },
    data: { role: "ADMIN" },
  });

  return NextResponse.json({ message: "Promoted to admin", userId: user.id });
}
