import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    const poolItems = await prisma.contentPool.findMany({
      where: { type: "POST", isUsed: false },
      select: {
        id: true,
        title: true,
        content: true,
        personality: true,
        category: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ poolItems });
  } catch (error) {
    console.error("Pool items fetch error:", error);
    return NextResponse.json({ error: "조회 실패" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, content, category } = body;

    if (!id) {
      return NextResponse.json({ error: "ID가 필요합니다" }, { status: 400 });
    }

    // Only allow editing unused items
    const item = await prisma.contentPool.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json({ error: "원고를 찾을 수 없습니다" }, { status: 404 });
    }
    if (item.isUsed) {
      return NextResponse.json({ error: "이미 발행된 원고는 수정할 수 없습니다" }, { status: 400 });
    }

    const updated = await prisma.contentPool.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(category !== undefined && { category }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Pool item update error:", error);
    return NextResponse.json({ error: "수정 실패" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, category, type } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "제목과 내용은 필수입니다" }, { status: 400 });
    }

    const item = await prisma.contentPool.create({
      data: {
        type: type || "POST",
        personality: "CUSTOM",
        title,
        content,
        category: category || "CHAT",
        isUsed: false,
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("Pool item create error:", error);
    return NextResponse.json({ error: "추가 실패" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    const body = await request.json();
    const ids: string[] = body.ids || (body.id ? [body.id] : []);
    if (ids.length === 0) {
      return NextResponse.json({ error: "ID가 필요합니다" }, { status: 400 });
    }

    await prisma.contentPool.deleteMany({ where: { id: { in: ids } } });

    return NextResponse.json({ message: "삭제되었습니다" });
  } catch (error) {
    console.error("Pool item delete error:", error);
    return NextResponse.json({ error: "삭제 실패" }, { status: 500 });
  }
}
