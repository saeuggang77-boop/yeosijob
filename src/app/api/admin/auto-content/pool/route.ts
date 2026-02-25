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
