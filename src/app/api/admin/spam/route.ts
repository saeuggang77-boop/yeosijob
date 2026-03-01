import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { invalidateSpamCache } from "@/lib/spam-filter";

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    const spamWords = await prisma.spamWord.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        admin: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ spamWords });
  } catch (error) {
    console.error("Spam words GET error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    const body = await request.json();
    const { word } = body;

    if (!word || typeof word !== "string" || word.trim().length === 0) {
      return NextResponse.json({ error: "단어를 입력해주세요" }, { status: 400 });
    }

    const normalizedWord = word.toLowerCase().trim();

    // Check for duplicates
    const existing = await prisma.spamWord.findUnique({
      where: { word: normalizedWord },
    });

    if (existing) {
      return NextResponse.json({ error: "이미 등록된 단어입니다" }, { status: 400 });
    }

    const spamWord = await prisma.spamWord.create({
      data: {
        word: normalizedWord,
        createdBy: session.user.id,
      },
      include: {
        admin: {
          select: {
            name: true,
          },
        },
      },
    });

    // Invalidate cache
    invalidateSpamCache();

    return NextResponse.json({ spamWord }, { status: 201 });
  } catch (error) {
    console.error("Spam word creation error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "잘못된 요청입니다" }, { status: 400 });
    }

    await prisma.spamWord.delete({
      where: { id },
    });

    // Invalidate cache
    invalidateSpamCache();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Spam word deletion error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
