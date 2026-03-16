import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
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
      include: { ad: { select: { id: true } } },
    });

    if (!payment) {
      return NextResponse.json({ error: "결제를 찾을 수 없습니다" }, { status: 404 });
    }

    // 광고가 존재하는 결제는 삭제 불가
    if (payment.ad) {
      return NextResponse.json(
        { error: "광고가 존재하는 결제는 삭제할 수 없습니다" },
        { status: 400 }
      );
    }

    await prisma.payment.delete({ where: { id } });

    return NextResponse.json({ message: "결제 기록이 삭제되었습니다" });
  } catch (error) {
    console.error("Payment delete error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
