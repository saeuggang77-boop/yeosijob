import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
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

    const { success } = checkRateLimit(`ad:${session.user.id}`, 3, 60_000);
    if (!success) {
      return NextResponse.json({ error: "너무 많은 요청입니다. 잠시 후 다시 시도해주세요" }, { status: 429 });
    }

    // 사업자 인증 확인
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isVerifiedBiz: true },
    });
    if (!user?.isVerifiedBiz) {
      return NextResponse.json(
        { error: "사업자 인증이 완료되지 않았습니다. 프로필에서 사업자등록번호를 제출하고 관리자 승인을 받아주세요." },
        { status: 403 }
      );
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
      useCredit,
    } = body;

    // 검증
    if (!businessName || !businessType || !contactPhone || !title || !salaryText || !description) {
      return NextResponse.json({ error: "필수 항목을 모두 입력해주세요" }, { status: 400 });
    }

    // BANNER는 전국 노출이므로 지역 선택 불필요
    if (productId !== "BANNER" && (!regions || regions.length === 0)) {
      return NextResponse.json({ error: "노출 지역을 선택해주세요" }, { status: 400 });
    }

    const isFreeProduct = productId === "FREE";

    // FREE 상품은 durationDays가 0이어야 함, 나머지는 30, 60, 90만 허용
    if (isFreeProduct) {
      if (durationDays !== 0) {
        return NextResponse.json({ error: "무료 광고는 기간이 0이어야 합니다" }, { status: 400 });
      }
    } else {
      if (![30, 60, 90].includes(durationDays)) {
        return NextResponse.json({ error: "올바른 기간을 선택해주세요" }, { status: 400 });
      }
    }

    const duration = durationDays as DurationDays;

    const product = AD_PRODUCTS[productId];
    if (!product) {
      return NextResponse.json({ error: "올바른 상품을 선택해주세요" }, { status: 400 });
    }

    // FREE 상품: 이미 활성화된 무료 광고가 있는지 확인
    if (isFreeProduct) {
      const existingFreeAd = await prisma.ad.count({
        where: {
          userId: session.user.id,
          productId: "FREE",
          status: "ACTIVE",
        },
      });
      if (existingFreeAd > 0) {
        return NextResponse.json({ error: "무료 광고는 1건만 등록할 수 있습니다" }, { status: 400 });
      }
    }

    // 유료 광고: 사업자당 최대 5개 제한
    if (!isFreeProduct) {
      const existingPaidAds = await prisma.ad.count({
        where: {
          userId: session.user.id,
          productId: { not: "FREE" },
          status: { in: ["ACTIVE", "PENDING_DEPOSIT"] },
        },
      });
      if (existingPaidAds >= 5) {
        return NextResponse.json({ error: "유료 광고는 최대 5개까지 등록할 수 있습니다" }, { status: 400 });
      }
    }

    // 무료 광고권 사용
    if (productId !== "FREE" && useCredit) {
      const creditResult = await prisma.$queryRaw<{ freeAdCredits: number }[]>`
        SELECT "freeAdCredits" FROM "users" WHERE id = ${session.user.id}
      `;

      if (!creditResult[0] || creditResult[0].freeAdCredits < 1) {
        return NextResponse.json({ error: "무료 광고권이 없습니다" }, { status: 400 });
      }

      const now = new Date();
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + durationDays);

      const orderId = `YSJ-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      // Transaction: create ad + decrement credit + create payment record
      const ad = await prisma.$transaction(async (tx) => {
        const newAd = await tx.ad.create({
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
            totalAmount: 0,
            status: "ACTIVE",
            startDate: now,
            endDate,
            autoJumpPerDay: product.autoJumpPerDay,
            manualJumpPerDay: product.manualJumpPerDay,
            maxEdits: product.maxEdits,
            isVerified: user.isVerifiedBiz || false,
          },
        });

        // Create options if any
        if (options && options.length > 0) {
          await tx.adOption.createMany({
            data: (options as string[]).map((optId: string) => ({
              adId: newAd.id,
              optionId: optId as AdOptionId,
              value: optionValues[optId] || null,
              durationDays: duration,
              startDate: now,
              endDate,
            })),
          });
        }

        // Payment record for audit trail
        await tx.payment.create({
          data: {
            userId: session.user.id,
            adId: newAd.id,
            orderId,
            amount: 0,
            method: "FREE_CREDIT",
            status: "APPROVED",
            paidAt: now,
            itemSnapshot: { product: productId, duration: durationDays, credit: true },
          },
        });

        // Decrement credit
        await tx.$queryRaw`
          UPDATE "users" SET "freeAdCredits" = "freeAdCredits" - 1 WHERE id = ${session.user.id}
        `;

        return newAd;
      });

      return NextResponse.json({ adId: ad.id, useCredit: true });
    }

    // 결제 수단 검증 (FREE 제외)
    if (!isFreeProduct) {
      const validMethods = ["CARD", "BANK_TRANSFER", "KAKAO_PAY"];
      if (!paymentMethod || !validMethods.includes(paymentMethod)) {
        return NextResponse.json({ error: "올바른 결제 수단을 선택해주세요" }, { status: 400 });
      }
    }

    // 지역 수 확인 (BANNER는 전국 노출이므로 skip)
    if (productId !== "BANNER" && regions.length > product.maxRegions) {
      return NextResponse.json(
        { error: `${product.name}은 최대 ${product.maxRegions}개 지역만 선택 가능합니다` },
        { status: 400 }
      );
    }

    // 노블레스 12건 한정 확인
    if (productId === "BANNER") {
      const activeCount = await prisma.ad.count({
        where: { productId: "BANNER", status: "ACTIVE" },
      });
      if (activeCount >= 12) {
        return NextResponse.json({ error: "노블레스는 현재 만석입니다" }, { status: 400 });
      }
    }

    // 금액 계산
    let totalAmount = 0;
    if (!isFreeProduct) {
      totalAmount = AD_PRODUCTS.LINE.pricing[duration];
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
    }

    // orderId 생성 (FREE는 불필요하지만 일관성을 위해 생성)
    const orderId = `YSJ-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // 트랜잭션으로 Ad + Payment 생성 (FREE는 Payment 생성 안 함)
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
          status: isFreeProduct ? "ACTIVE" : "PENDING_DEPOSIT",
          startDate: isFreeProduct ? new Date() : null,
          endDate: null,
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

      // FREE 상품은 Payment 레코드를 생성하지 않음
      if (isFreeProduct) {
        return { ad, payment: null };
      }

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

    // FREE 상품은 orderId와 amount 없이 반환
    if (isFreeProduct) {
      return NextResponse.json(
        {
          adId: result.ad.id,
        },
        { status: 201 }
      );
    }

    // 무통장 입금 대기 → 관리자에게 알림 (fire and forget)
    prisma.user
      .findMany({ where: { role: "ADMIN" }, select: { id: true } })
      .then((admins) => {
        if (admins.length > 0) {
          return prisma.notification.createMany({
            data: admins.map((admin) => ({
              userId: admin.id,
              title: "새 무통장 입금 대기",
              message: `${businessName}에서 ${product.name} 광고 결제를 신청했습니다 (${totalAmount.toLocaleString()}원)`,
              link: "/admin/payments",
            })),
          });
        }
      })
      .catch(() => {});

    return NextResponse.json(
      {
        adId: result.ad.id,
        orderId: result.payment?.orderId,
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
