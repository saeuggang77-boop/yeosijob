import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { stripHtml } from "@/lib/utils/format";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    if (session.user.role !== "JOBSEEKER") {
      return NextResponse.json(
        { error: "구직자만 후기를 작성할 수 있습니다" },
        { status: 403 }
      );
    }

    const { success } = await checkRateLimit(`review:${session.user.id}`, 5, 60_000);
    if (!success) {
      return NextResponse.json({ error: "너무 많은 요청입니다. 잠시 후 다시 시도해주세요" }, { status: 429 });
    }

    const body = await request.json();
    const { adId, rating } = body;
    const content = stripHtml(body.content || "");

    // Validation
    if (!adId || !rating || !content) {
      return NextResponse.json(
        { error: "필수 항목을 입력해주세요" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "별점은 1~5점 사이여야 합니다" },
        { status: 400 }
      );
    }

    if (content.length < 10 || content.length > 500) {
      return NextResponse.json(
        { error: "후기 내용은 10자 이상 500자 이하여야 합니다" },
        { status: 400 }
      );
    }

    // Check if ad exists
    const ad = await prisma.ad.findUnique({
      where: { id: adId },
      select: { id: true, userId: true, businessName: true },
    });

    if (!ad) {
      return NextResponse.json(
        { error: "존재하지 않는 채용 공고입니다" },
        { status: 404 }
      );
    }

    // Check for duplicate review
    const existingReview = await prisma.review.findUnique({
      where: {
        adId_userId: {
          adId,
          userId: session.user.id,
        },
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "이미 해당 업소에 후기를 작성했습니다" },
        { status: 400 }
      );
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        adId,
        userId: session.user.id,
        rating,
        content,
      },
      include: {
        user: {
          select: { name: true },
        },
      },
    });

    // 사장님에게 알림 전송 (실패해도 후기 생성은 성공)
    try {
      await prisma.notification.create({
        data: {
          userId: ad.userId,
          title: "새로운 후기가 등록되었습니다",
          message: `${ad.businessName}에 새 후기가 등록되었습니다.`,
          link: `/jobs/${ad.id}`,
        },
      });
    } catch {}

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("Review creation error:", error);
    return NextResponse.json(
      { error: "후기 작성 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
