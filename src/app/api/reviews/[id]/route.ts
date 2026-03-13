import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(
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
    const { rating, content } = await request.json();

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "별점을 선택해주세요 (1~5)" },
        { status: 400 }
      );
    }

    if (!content || content.length < 10 || content.length > 500) {
      return NextResponse.json(
        { error: "후기는 10자 이상 500자 이하로 입력해주세요" },
        { status: 400 }
      );
    }

    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      return NextResponse.json(
        { error: "존재하지 않는 후기입니다" },
        { status: 404 }
      );
    }

    if (review.userId !== session.user.id) {
      return NextResponse.json(
        { error: "본인이 작성한 후기만 수정할 수 있습니다" },
        { status: 403 }
      );
    }

    if (review.reply) {
      return NextResponse.json(
        { error: "사장님 답글이 있는 후기는 수정할 수 없습니다" },
        { status: 400 }
      );
    }

    await prisma.review.update({
      where: { id },
      data: { rating, content },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Review update error:", error);
    return NextResponse.json(
      { error: "후기 수정 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
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

    if (review.reply) {
      return NextResponse.json(
        { error: "사장님 답글이 있는 후기는 삭제할 수 없습니다" },
        { status: 400 }
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
