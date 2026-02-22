import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    // Find review
    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      return NextResponse.json(
        { error: "존재하지 않는 후기입니다" },
        { status: 404 }
      );
    }

    // Check ownership
    if (review.userId !== session.user.id) {
      return NextResponse.json(
        { error: "본인이 작성한 후기만 삭제할 수 있습니다" },
        { status: 403 }
      );
    }

    // Delete review
    await prisma.review.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Review deletion error:", error);
    return NextResponse.json(
      { error: "후기 삭제 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
