import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_FIELDS = [
  "name",
  "category",
  "region",
  "address",
  "description",
  "highlight",
  "thumbnailUrl",
  "detailImages",
  "contactPhone",
  "contactKakao",
  "websiteUrl",
  "businessHours",
] as const;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || (session.user.role !== "BUSINESS" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const partner = await prisma.partner.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        name: true,
        category: true,
        region: true,
        address: true,
        description: true,
        highlight: true,
        tags: true,
        thumbnailUrl: true,
        detailImages: true,
        contactPhone: true,
        contactKakao: true,
        websiteUrl: true,
        businessHours: true,
        grade: true,
        monthlyPrice: true,
        status: true,
        isProfileComplete: true,
        businessNumber: true,
        bizOwnerName: true,
        isVerifiedBiz: true,
      },
    });

    if (!partner) {
      return NextResponse.json({ error: "제휴업체를 찾을 수 없습니다" }, { status: 404 });
    }

    if (partner.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    return NextResponse.json({ partner });
  } catch (error) {
    console.error("Business partner GET error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || (session.user.role !== "BUSINESS" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
  }

  try {
    const { id } = await params;

    // 소유권 확인
    const existing = await prisma.partner.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "제휴업체를 찾을 수 없습니다" }, { status: 404 });
    }

    if (existing.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    const body = await request.json();

    // 허용된 필드만 추출
    const updateData: Record<string, unknown> = {};
    for (const field of ALLOWED_FIELDS) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // 필수 정보 입력 확인 → isProfileComplete 자동 설정
    const name = (updateData.name as string) || "";
    const category = updateData.category as string;
    const region = updateData.region as string;
    const description = (updateData.description as string) || "";

    if (name && name !== "미등록 업체" && category && region) {
      updateData.isProfileComplete = true;
    }

    const partner = await prisma.partner.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        status: true,
        paymentToken: true,
        isProfileComplete: true,
      },
    });

    // ISR 캐시 무효화 - 공개 리스트/상세 페이지 즉시 반영
    revalidatePath("/partner");
    revalidatePath(`/partner/${id}`);

    return NextResponse.json({ partner });
  } catch (error) {
    console.error("Business partner update error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
