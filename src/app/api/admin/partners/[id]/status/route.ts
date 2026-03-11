import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { status } = await request.json();

    const validStatuses = ["PENDING_PAYMENT", "ACTIVE", "EXPIRED", "CANCELLED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "유효하지 않은 상태입니다" }, { status: 400 });
    }

    const now = new Date();
    const updateData: Record<string, unknown> = { status };

    // ACTIVE로 변경 시 기간 설정
    if (status === "ACTIVE") {
      const partner = await prisma.partner.findUnique({ where: { id } });
      if (partner && !partner.startDate) {
        const endDate = new Date(now);
        endDate.setDate(endDate.getDate() + partner.durationDays);
        updateData.startDate = now;
        updateData.endDate = endDate;
      }
    }

    const partner = await prisma.partner.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ partner });
  } catch (error) {
    console.error("Partner status change error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
