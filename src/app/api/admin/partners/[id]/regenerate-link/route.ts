import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "node:crypto";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const newToken = crypto.randomUUID();

    const partner = await prisma.partner.update({
      where: { id },
      data: { paymentToken: newToken },
    });

    return NextResponse.json({ paymentToken: newToken, partner });
  } catch (error) {
    console.error("Partner link regeneration error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
