import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { revalidatePath } from "next/cache";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get partner and increment view count
    const partner = await prisma.partner.update({
      where: { id, status: "ACTIVE" },
      data: {
        viewCount: { increment: 1 },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!partner) {
      return NextResponse.json({ error: "파트너를 찾을 수 없습니다" }, { status: 404 });
    }

    return NextResponse.json({ partner });
  } catch (error) {
    console.error("Partner detail error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== "BUSINESS" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    const { success: rateLimitOk } = await checkRateLimit(`partner-delete:${session.user.id}`, 5, 60_000);
    if (!rateLimitOk) {
      return NextResponse.json({ error: "너무 많은 요청입니다. 잠시 후 다시 시도해주세요" }, { status: 429 });
    }

    const { id } = await params;

    const partner = await prisma.partner.findUnique({
      where: { id },
      select: { id: true, userId: true, status: true },
    });

    if (!partner) {
      return NextResponse.json({ error: "제휴업체를 찾을 수 없습니다" }, { status: 404 });
    }

    // 본인 소유 또는 ADMIN만 삭제 가능
    if (partner.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    // PENDING_PAYMENT 상태만 삭제 가능
    if (partner.status !== "PENDING_PAYMENT") {
      return NextResponse.json(
        { error: "결제 대기 중인 제휴업체만 삭제할 수 있습니다" },
        { status: 403 }
      );
    }

    // Payment는 partnerId가 optional이므로 연결만 해제 + Partner DB 삭제
    await prisma.$transaction(async (tx) => {
      await tx.payment.updateMany({
        where: { partnerId: id },
        data: { partnerId: null },
      });

      await tx.partner.delete({
        where: { id },
      });
    });

    revalidatePath("/business/partner");

    return NextResponse.json({ message: "제휴업체 등록이 취소되었습니다", action: "deleted" });
  } catch (error) {
    console.error("Partner delete error:", error);
    return NextResponse.json({ error: "삭제에 실패했습니다" }, { status: 500 });
  }
}
