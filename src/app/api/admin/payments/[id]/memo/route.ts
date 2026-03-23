import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    const { id } = await params;
    const { memo } = await request.json();

    if (typeof memo !== "string" && memo !== null) {
      return NextResponse.json({ error: "올바르지 않은 값입니다" }, { status: 400 });
    }

    await prisma.payment.update({
      where: { id },
      data: { adminMemo: memo || null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Payment memo update error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
