import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendReportNotificationEmail } from "@/lib/email-report";

const VALID_REASONS = ["ABUSE", "OBSCENE", "SPAM", "PRIVACY", "OTHER"];

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const body = await request.json();
    const { postId, commentId, reason, detail } = body;

    // 유효성 검사
    if (!postId && !commentId) {
      return NextResponse.json({ error: "신고 대상을 지정해주세요" }, { status: 400 });
    }

    if (!reason || !VALID_REASONS.includes(reason)) {
      return NextResponse.json({ error: "신고 사유를 선택해주세요" }, { status: 400 });
    }

    if (detail && detail.length > 500) {
      return NextResponse.json({ error: "상세 내용은 500자 이내로 입력해주세요" }, { status: 400 });
    }

    // 자기 글/댓글 신고 방지
    if (postId) {
      const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { authorId: true, title: true, content: true },
      });
      if (!post) {
        return NextResponse.json({ error: "게시글을 찾을 수 없습니다" }, { status: 404 });
      }
      if (post.authorId === session.user.id) {
        return NextResponse.json({ error: "본인의 글은 신고할 수 없습니다" }, { status: 400 });
      }
    }

    if (commentId) {
      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        select: { authorId: true, content: true, postId: true },
      });
      if (!comment) {
        return NextResponse.json({ error: "댓글을 찾을 수 없습니다" }, { status: 404 });
      }
      if (comment.authorId === session.user.id) {
        return NextResponse.json({ error: "본인의 댓글은 신고할 수 없습니다" }, { status: 400 });
      }
    }

    // 중복 신고 체크
    const existing = await prisma.report.findFirst({
      where: {
        reporterId: session.user.id,
        ...(postId ? { postId } : { commentId }),
      },
    });

    if (existing) {
      return NextResponse.json({ error: "이미 신고한 항목입니다" }, { status: 409 });
    }

    // 신고 생성
    const report = await prisma.report.create({
      data: {
        reporterId: session.user.id,
        postId: postId || null,
        commentId: commentId || null,
        reason,
        detail: detail?.trim() || null,
      },
    });

    // 관리자에게 인앱 알림
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    let targetTitle = "";
    if (postId) {
      const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { title: true },
      });
      targetTitle = post?.title || "삭제된 게시글";
    } else {
      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        select: { content: true },
      });
      targetTitle = comment?.content?.substring(0, 50) || "삭제된 댓글";
    }

    const REASON_LABELS: Record<string, string> = {
      ABUSE: "욕설/비방",
      OBSCENE: "음란물",
      SPAM: "광고/홍보",
      PRIVACY: "개인정보노출",
      OTHER: "기타",
    };

    const targetType = postId ? "게시글" : "댓글";

    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          title: `${targetType} 신고 접수`,
          message: `[${REASON_LABELS[reason]}] ${targetTitle}`,
          link: "/admin/reports",
        })),
      });
    }

    // 이메일 알림 (비동기, 실패해도 무시)
    sendReportNotificationEmail({
      targetType: postId ? "게시글" : "댓글",
      targetTitle,
      reason,
      detail,
      reporterName: session.user.name || "익명",
    });

    return NextResponse.json({ success: true, id: report.id });
  } catch (error) {
    console.error("Report creation error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
