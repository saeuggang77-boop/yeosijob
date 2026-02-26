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
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!["RESOLVED", "DISMISSED"].includes(status)) {
      return NextResponse.json({ error: "유효하지 않은 상태입니다" }, { status: 400 });
    }

    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) {
      return NextResponse.json({ error: "신고를 찾을 수 없습니다" }, { status: 404 });
    }

    const updated = await prisma.report.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ success: true, report: updated });
  } catch (error) {
    console.error("Report update error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
