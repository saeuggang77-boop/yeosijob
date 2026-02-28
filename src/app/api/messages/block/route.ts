import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

// GET /api/messages/block - 내 차단 목록 조회
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const blocks = await prisma.messageBlock.findMany({
      where: { blockerId: userId },
      include: {
        blocked: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      blocks: blocks.map((b) => ({
        id: b.id,
        blockedId: b.blockedId,
        blockedName: b.blocked.name || "알 수 없음",
        createdAt: b.createdAt,
      })),
    });
  } catch (error) {
    console.error("GET /api/messages/block error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/messages/block - 차단 추가
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { success } = checkRateLimit(`block:${session.user.id}`, 10, 60_000);
  if (!success) {
    return NextResponse.json({ error: "너무 많은 요청입니다. 잠시 후 다시 시도해주세요" }, { status: 429 });
  }

  const userId = session.user.id;

  try {
    const body = await req.json();
    const { blockedId } = body;

    if (!blockedId) {
      return NextResponse.json(
        { error: "blockedId는 필수입니다" },
        { status: 400 }
      );
    }

    if (blockedId === userId) {
      return NextResponse.json(
        { error: "자기자신을 차단할 수 없습니다" },
        { status: 400 }
      );
    }

    // 이미 차단했는지 확인
    const existing = await prisma.messageBlock.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: userId,
          blockedId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "이미 차단한 사용자입니다" },
        { status: 400 }
      );
    }

    // 차단 추가 + 횟수 증가 + 제재를 하나의 트랜잭션으로 처리
    const { block, blockCount } = await prisma.$transaction(async (tx) => {
      const block = await tx.messageBlock.create({
        data: {
          blockerId: userId,
          blockedId,
        },
      });

      const updatedUser = await tx.user.update({
        where: { id: blockedId },
        data: {
          messageBlockCount: {
            increment: 1,
          },
        },
        select: {
          messageBlockCount: true,
        },
      });

      const blockCount = updatedUser.messageBlockCount;

      // 누적 횟수에 따른 자동 제재
      if (blockCount === 3) {
        // 3회: 경고 알림
        await tx.notification.create({
          data: {
            userId: blockedId,
            title: "쪽지 경고",
            message:
              "수신거부가 3회 누적되었습니다. 추가 누적 시 쪽지 기능이 정지됩니다.",
          },
        });
      } else if (blockCount === 5) {
        // 5회: 10일 정지
        const banUntil = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
        await tx.user.update({
          where: { id: blockedId },
          data: {
            messageBannedUntil: banUntil,
          },
        });

        await tx.notification.create({
          data: {
            userId: blockedId,
            title: "쪽지 기능 정지",
            message: `수신거부가 5회 누적되어 쪽지 기능이 정지되었습니다 (해제일: ${banUntil.toISOString().split("T")[0]})`,
          },
        });
      } else if (blockCount === 10) {
        // 10회: 영구 정지
        const permanentBan = new Date("9999-12-31");
        await tx.user.update({
          where: { id: blockedId },
          data: {
            messageBannedUntil: permanentBan,
          },
        });

        await tx.notification.create({
          data: {
            userId: blockedId,
            title: "쪽지 기능 영구 정지",
            message:
              "수신거부가 10회 누적되어 쪽지 기능이 영구 정지되었습니다.",
          },
        });
      }

      return { block, blockCount };
    });

    return NextResponse.json({ block, blockCount });
  } catch (error) {
    console.error("POST /api/messages/block error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/messages/block - 차단 해제
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const body = await req.json();
    const { blockedId } = body;

    if (!blockedId) {
      return NextResponse.json(
        { error: "blockedId는 필수입니다" },
        { status: 400 }
      );
    }

    // 차단 삭제
    await prisma.messageBlock.deleteMany({
      where: {
        blockerId: userId,
        blockedId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/messages/block error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
