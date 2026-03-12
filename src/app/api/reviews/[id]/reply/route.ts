import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripHtml } from "@/lib/utils/format";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(
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

    if (session.user.role !== "BUSINESS" && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "업체 관계자만 답글을 작성할 수 있습니다" },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    // Find review with ad info
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        ad: { select: { id: true, businessName: true, userId: true } },
      },
    });

    if (!review) {
      return NextResponse.json(
        { error: "존재하지 않는 후기입니다" },
        { status: 404 }
      );
    }

    // Check ownership: only ad owner can reply
    if (review.ad.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "본인 업소의 후기에만 답글을 달 수 있습니다" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const reply = stripHtml(body.reply || "");

    if (reply.length < 5 || reply.length > 500) {
      return NextResponse.json(
        { error: "답글은 5자 이상 500자 이하여야 합니다" },
        { status: 400 }
      );
    }

    // Update review with reply
    const updated = await prisma.review.update({
      where: { id },
      data: {
        reply,
        repliedAt: new Date(),
      },
    });

    // 후기 작성자(구직자)에게 알림 전송
    try {
      await prisma.notification.create({
        data: {
          userId: review.userId,
          title: "사장님이 답글을 달았습니다",
          message: `${review.ad.businessName}에서 내 후기에 답글을 남겼습니다.`,
          link: `/jobs/${review.ad.id}`,
        },
      });
    } catch {}

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Review reply error:", error);
    return NextResponse.json(
      { error: "답글 작성 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
