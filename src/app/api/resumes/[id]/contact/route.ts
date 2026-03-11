import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 연락완료 표시
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || (session.user.role !== "BUSINESS" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
  }

  const { id } = await params;

  // 이력서 존재 확인
  const resume = await prisma.resume.findUnique({ where: { id } });
  if (!resume) {
    return NextResponse.json({ error: "이력서를 찾을 수 없습니다" }, { status: 404 });
  }

  await prisma.resumeContact.upsert({
    where: { userId_resumeId: { userId: session.user.id, resumeId: id } },
    create: { userId: session.user.id, resumeId: id },
    update: {},
  });

  return NextResponse.json({ contacted: true });
}

// 연락완료 해제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || (session.user.role !== "BUSINESS" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
  }

  const { id } = await params;

  await prisma.resumeContact.deleteMany({
    where: { userId: session.user.id, resumeId: id },
  });

  return NextResponse.json({ contacted: false });
}
