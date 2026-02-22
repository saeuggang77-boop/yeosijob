import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const reason = body.reason || "";

    const ad = await prisma.ad.findUnique({ where: { id } });
    if (!ad) {
      return NextResponse.json({ error: "광고를 찾을 수 없습니다" }, { status: 404 });
    }

    if (!["PENDING_REVIEW", "PENDING_DEPOSIT"].includes(ad.status)) {
      return NextResponse.json(
        { error: `반려할 수 없는 상태입니다 (${ad.status})` },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.ad.update({
        where: { id },
        data: { status: "REJECTED" },
      });

      // 관련 결제도 취소
      await tx.payment.updateMany({
        where: { adId: id, status: "PENDING" },
        data: { status: "CANCELLED", failReason: reason || "관리자 반려" },
      });
    });

    return NextResponse.json({ message: "광고가 반려되었습니다", adId: id });
  } catch (error) {
    console.error("Ad reject error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
