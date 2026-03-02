import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH - 리뷰 수정 (숨김/공개 토글, 내용 수정)
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
    const body = await request.json();
    const { isHidden, content, rating } = body;

    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      return NextResponse.json({ error: "리뷰를 찾을 수 없습니다" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (typeof isHidden === "boolean") updateData.isHidden = isHidden;
    if (typeof content === "string" && content.trim()) updateData.content = content.trim();
    if (typeof rating === "number" && rating >= 1 && rating <= 5) updateData.rating = rating;

    const updated = await prisma.review.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ message: "리뷰가 수정되었습니다", review: updated });
  } catch (error) {
    console.error("Admin review update error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}

// DELETE - 리뷰 삭제
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

    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      return NextResponse.json({ error: "리뷰를 찾을 수 없습니다" }, { status: 404 });
    }

    await prisma.review.delete({ where: { id } });

    return NextResponse.json({ message: "리뷰가 삭제되었습니다" });
  } catch (error) {
    console.error("Admin review delete error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
