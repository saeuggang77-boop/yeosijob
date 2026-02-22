import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AD_PRODUCTS, AD_OPTIONS, type DurationDays } from "@/lib/constants/products";
import type { Region, BusinessType, AdProductId, AdOptionId, PaymentMethod } from "@/generated/prisma/client";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const region = searchParams.get("region") as Region | null;
  const businessType = searchParams.get("businessType") as BusinessType | null;
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  const where: Record<string, unknown> = {
    status: "ACTIVE",
  };

  if (region) {
    where.regions = { has: region };
  }

  if (businessType) {
    where.businessType = businessType;
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { businessName: { contains: search, mode: "insensitive" } },
    ];
  }

  const [ads, total] = await Promise.all([
    prisma.ad.findMany({
      where,
      orderBy: { lastJumpedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        title: true,
        businessName: true,
        businessType: true,
        regions: true,
        salaryText: true,
        isVerified: true,
        viewCount: true,
        lastJumpedAt: true,
        productId: true,
        options: {
          select: {
            optionId: true,
            value: true,
          },
        },
      },
    }),
    prisma.ad.count({ where }),
  ]);

  return NextResponse.json({
    ads,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "BUSINESS") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    const body = await request.json();
    const {
      businessName,
      businessType,
      contactPhone,
      contactKakao,
      address,
      addressDetail,
      title,
      salaryText,
      workHours,
      benefits,
      description,
      regions,
      durationDays,
      productId,
      options = [],
      optionValues = {},
      paymentMethod,
    } = body;

    // 검증
    if (!businessName || !businessType || !contactPhone || !title || !salaryText || !description) {
      return NextResponse.json({ error: "필수 항목을 모두 입력해주세요" }, { status: 400 });
    }

    if (!regions || regions.length === 0) {
      return NextResponse.json({ error: "노출 지역을 선택해주세요" }, { status: 400 });
    }

    const duration = durationDays as DurationDays;
    if (![30, 60, 90].includes(duration)) {
      return NextResponse.json({ error: "올바른 기간을 선택해주세요" }, { status: 400 });
    }

    const product = AD_PRODUCTS[productId];
    if (!product) {
      return NextResponse.json({ error: "올바른 상품을 선택해주세요" }, { status: 400 });
    }

    // 결제 수단 검증
    const validMethods = ["CARD", "BANK_TRANSFER", "KAKAO_PAY"];
    if (paymentMethod && !validMethods.includes(paymentMethod)) {
      return NextResponse.json({ error: "올바른 결제 수단을 선택해주세요" }, { status: 400 });
    }

    // 지역 수 확인
    if (regions.length > product.maxRegions) {
      return NextResponse.json(
        { error: `${product.name}은 최대 ${product.maxRegions}개 지역만 선택 가능합니다` },
        { status: 400 }
      );
    }

    // 특수배너 12건 한정 확인
    if (productId === "BANNER") {
      const activeCount = await prisma.ad.count({
        where: { productId: "BANNER", status: "ACTIVE" },
      });
      if (activeCount >= 12) {
        return NextResponse.json({ error: "특수배너는 현재 만석입니다" }, { status: 400 });
      }
    }

    // 금액 계산
    let totalAmount = AD_PRODUCTS.LINE.pricing[duration];
    if (productId !== "LINE") {
      totalAmount += product.pricing[duration];
    }
    for (const optId of options) {
      const opt = AD_OPTIONS[optId as keyof typeof AD_OPTIONS];
      if (opt) {
        const isFree = optId === "ICON" && product.includeIconFree;
        if (!isFree) {
          totalAmount += opt.pricing[duration];
        }
      }
    }

    // orderId 생성
    const orderId = `YSA-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // 트랜잭션으로 Ad + Payment 생성
    const result = await prisma.$transaction(async (tx) => {
      const ad = await tx.ad.create({
        data: {
          userId: session.user.id,
          businessName,
          businessType: businessType as BusinessType,
          contactPhone: contactPhone.replace(/-/g, ""),
          contactKakao: contactKakao || null,
          address: address || null,
          addressDetail: addressDetail || null,
          title,
          salaryText,
          workHours: workHours || null,
          benefits: benefits || null,
          description,
          regions: regions as Region[],
          productId: productId as AdProductId,
          durationDays: duration,
          totalAmount,
          status: "PENDING_DEPOSIT",
          autoJumpPerDay: product.autoJumpPerDay,
          manualJumpPerDay: product.manualJumpPerDay,
          maxEdits: product.maxEdits,
          options: {
            create: (options as string[]).map((optId: string) => ({
              optionId: optId as AdOptionId,
              value: optionValues[optId] || null,
              durationDays: duration,
            })),
          },
        },
      });

      const payment = await tx.payment.create({
        data: {
          userId: session.user.id,
          adId: ad.id,
          orderId,
          amount: totalAmount,
          method: (paymentMethod || "BANK_TRANSFER") as PaymentMethod,
          status: "PENDING",
          itemSnapshot: {
            product: { id: productId, name: product.name },
            options: (options as string[]).map((optId: string) => ({
              id: optId,
              name: AD_OPTIONS[optId as keyof typeof AD_OPTIONS]?.name,
            })),
            duration,
            breakdown: {
              line: AD_PRODUCTS.LINE.pricing[duration],
              upgrade: productId !== "LINE" ? product.pricing[duration] : 0,
              options: (options as string[]).reduce(
                (sum: number, optId: string) => {
                  const opt = AD_OPTIONS[optId as keyof typeof AD_OPTIONS];
                  if (!opt) return sum;
                  const isFree = optId === "ICON" && product.includeIconFree;
                  return sum + (isFree ? 0 : opt.pricing[duration]);
                },
                0
              ),
              total: totalAmount,
            },
          },
        },
      });

      return { ad, payment };
    });

    return NextResponse.json(
      {
        adId: result.ad.id,
        orderId: result.payment.orderId,
        amount: totalAmount,
        orderName: businessName + " 광고",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Ad creation error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
