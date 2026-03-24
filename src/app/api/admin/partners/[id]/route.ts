import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const partner = await prisma.partner.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        payments: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!partner) {
      return NextResponse.json({ error: "파트너를 찾을 수 없습니다" }, { status: 404 });
    }

    return NextResponse.json({ partner });
  } catch (error) {
    console.error("Partner detail error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    // 허용된 필드만 업데이트 (mass assignment 방지)
    const allowedFields = [
      "name", "description", "highlight", "category", "region",
      "contactPhone", "contactKakao", "websiteUrl", "businessHours",
      "address", "latitude", "longitude", "monthlyPrice", "durationDays",
      "isProfileComplete", "isVerifiedBiz", "businessNumber", "bizOwnerName",
      "images",
    ];
    const updateData: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in body) {
        updateData[key] = body[key];
      }
    }

    const partner = await prisma.partner.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ partner });
  } catch (error) {
    console.error("Partner update error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Delete related payments first
    await prisma.payment.deleteMany({
      where: { partnerId: id },
    });

    // Delete partner
    await prisma.partner.delete({
      where: { id },
    });

    return NextResponse.json({ message: "파트너가 삭제되었습니다" });
  } catch (error) {
    console.error("Partner deletion error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
