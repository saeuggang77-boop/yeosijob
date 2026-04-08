import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { AD_PRODUCTS, AD_OPTIONS, type DurationDays } from "@/lib/constants/products";
import type { Region, BusinessType, AdProductId, AdOptionId, PaymentMethod } from "@/generated/prisma/client";
import crypto from "node:crypto";


export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const region = searchParams.get("region") as Region | null;
  const district = searchParams.get("district");
  const businessType = searchParams.get("businessType") as BusinessType | null;
  const search = searchParams.get("search");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20));

  const where: Record<string, unknown> = {
    status: "ACTIVE",
  };

  if (region) {
    where.regions = { has: region };
  }

  if (district) {
    where.districts = { has: district };
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
        districts: true,
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

    // 사용자 정보 먼저 조회 (스탭 계정 분기에 필요)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isVerifiedBiz: true, businessNumber: true, isStaff: true },
    });
    if (!user) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다" }, { status: 404 });
    }

    // 스탭 계정 분기 (피처 플래그 + isStaff)
    if (user.isStaff && process.env.ENABLE_STAFF_ADS === "true") {
      return await handleStaffAdCreation(request, session.user.id);
    }

    // 일반 사장님: Rate limit
    const { success } = await checkRateLimit(`ad:${session.user.id}`, 3, 60_000);
    if (!success) {
      return NextResponse.json({ error: "너무 많은 요청입니다. 잠시 후 다시 시도해주세요" }, { status: 429 });
    }

    // 사업자 인증 확인
    if (!user.isVerifiedBiz) {
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
      contactTelegram,
      address,
      addressDetail,
      locationHint,
      title,
      salaryText,
      workHours,
      benefits,
      description,
      workEnvironment,
      safetyInfo,
      regions,
      districts = [],
      durationDays,
      productId,
      options = [],
      optionValues = {},
      useCredit,
      bannerColor,
    bannerTitle,
    bannerSubtitle,
    bannerTemplate,
    detailImages = [],
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

    // 같은 사업자번호를 가진 모든 인증 계정 조회 (FREE/유료 광고 제한 공통)
    let sameBusinessUserIds = [session.user.id];
    if (user.businessNumber) {
      const sameBusinessUsers = await prisma.user.findMany({
        where: { businessNumber: user.businessNumber, isVerifiedBiz: true },
        select: { id: true },
      });
      sameBusinessUserIds = sameBusinessUsers.map((u) => u.id);
    }

    // FREE 상품: 같은 사업자번호 기준 활성 무료 광고 2건 제한
    if (isFreeProduct) {
      const existingFreeAd = await prisma.ad.count({
        where: {
          userId: { in: sameBusinessUserIds },
          productId: "FREE",
          status: "ACTIVE",
        },
      });
      if (existingFreeAd >= 2) {
        return NextResponse.json({ error: "같은 사업자번호로 등록된 무료 광고가 이미 2건 있습니다. 무료 광고는 사업자번호당 2건까지 가능합니다." }, { status: 400 });
      }
    }

    // 유료 광고: 같은 사업자번호 기준 최대 5건 제한
    if (!isFreeProduct) {
      const existingPaidAds = await prisma.ad.count({
        where: {
          userId: { in: sameBusinessUserIds },
          productId: { not: "FREE" },
          status: { in: ["ACTIVE", "PENDING_DEPOSIT"] },
        },
      });
      if (existingPaidAds >= 5) {
        return NextResponse.json({ error: "같은 사업자번호로 등록된 유료 광고가 이미 5건 있습니다. 유료 광고는 사업자번호당 5건까지 가능합니다." }, { status: 400 });
      }
    }

    // 무료 광고권 사용
    if (productId !== "FREE" && useCredit) {
      const now = new Date();
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + durationDays);

      const orderId = `YSJ-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

      // #4: TOCTOU 수정 - 크레딧 확인을 트랜잭션 안으로 이동, atomic UPDATE 사용
      const ad = await prisma.$transaction(async (tx) => {
        // Atomic credit decrement with check
        const updateResult = await tx.user.updateMany({
          where: { id: session.user.id, freeAdCredits: { gte: 1 } },
          data: { freeAdCredits: { decrement: 1 } },
        });
        if (updateResult.count === 0) {
          throw new Error("무료 광고권이 없습니다");
        }

        const newAd = await tx.ad.create({
          data: {
            userId: session.user.id,
            businessName,
            businessType: businessType as BusinessType,
            contactPhone: contactPhone.replace(/-/g, ""),
            contactKakao: contactKakao || null,
            contactTelegram: contactTelegram || null,
            address: address || null,
            addressDetail: addressDetail || null,
            locationHint: locationHint || null,
            title,
            salaryText,
            workHours: workHours || null,
            benefits: benefits || null,
            description,
            workEnvironment: workEnvironment || null,
            safetyInfo: safetyInfo || null,
            regions: regions as Region[],
            districts: Array.isArray(districts) ? districts : [],
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
            bannerColor: bannerColor ?? 0,
            bannerTitle: bannerTitle || null,
            bannerSubtitle: bannerSubtitle || null,
            bannerTemplate: bannerTemplate ?? 0,
            detailImages: Array.isArray(detailImages) ? detailImages.slice(0, 10) : [],
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

        return newAd;
      });

      return NextResponse.json({ adId: ad.id, useCredit: true });
    }

    // 결제 수단은 위젯에서 선택하므로 서버에서는 placeholder로 저장 (confirm에서 실제 method로 갱신)

    // 지역 수 확인 (BANNER는 전국 노출이므로 skip)
    if (productId !== "BANNER" && regions.length > product.maxRegions) {
      return NextResponse.json(
        { error: `${product.name}은 최대 ${product.maxRegions}개 지역만 선택 가능합니다` },
        { status: 400 }
      );
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
    const orderId = `YSJ-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

    // 트랜잭션으로 Ad + Payment 생성 (FREE는 Payment 생성 안 함)
    const result = await prisma.$transaction(async (tx) => {
      const ad = await tx.ad.create({
        data: {
          userId: session.user.id,
          businessName,
          businessType: businessType as BusinessType,
          contactPhone: contactPhone.replace(/-/g, ""),
          contactKakao: contactKakao || null,
          contactTelegram: contactTelegram || null,
          address: address || null,
          addressDetail: addressDetail || null,
          locationHint: locationHint || null,
          title,
          salaryText,
          workHours: workHours || null,
          benefits: benefits || null,
          description,
          workEnvironment: workEnvironment || null,
          safetyInfo: safetyInfo || null,
          regions: regions as Region[],
          districts: Array.isArray(districts) ? districts : [],
          productId: productId as AdProductId,
          durationDays: duration,
          totalAmount,
          status: isFreeProduct ? "ACTIVE" : "PENDING_DEPOSIT",
          startDate: isFreeProduct ? new Date() : null,
          endDate: null,
          autoJumpPerDay: product.autoJumpPerDay,
          manualJumpPerDay: product.manualJumpPerDay,
          maxEdits: product.maxEdits,
          bannerColor: bannerColor ?? 0,
          bannerTitle: bannerTitle || null,
          bannerSubtitle: bannerSubtitle || null,
          bannerTemplate: bannerTemplate ?? 0,
          detailImages: Array.isArray(detailImages) ? detailImages.slice(0, 10) : [],
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
          method: "BANK_TRANSFER" as PaymentMethod,
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
    const message = error instanceof Error ? error.message : "서버 오류가 발생했습니다";
    // 사용자에게 보여줄 수 있는 에러 메시지
    const userMessages = ["무료 광고권이 없습니다"];
    const isUserError = userMessages.some((m) => message.includes(m));
    return NextResponse.json(
      { error: isUserError ? message : "서버 오류가 발생했습니다" },
      { status: isUserError ? 400 : 500 }
    );
  }
}

// ─────────────────────────────────────────────
// 스탭 계정 전용: 결제/제한 없이 ACTIVE 광고 즉시 생성
// ─────────────────────────────────────────────
async function handleStaffAdCreation(request: NextRequest, userId: string) {
  try {
    const body = await request.json();
    const {
      businessName,
      businessType,
      contactPhone,
      contactKakao,
      contactTelegram,
      address,
      addressDetail,
      locationHint,
      title,
      salaryText,
      workHours,
      benefits,
      description,
      workEnvironment,
      safetyInfo,
      regions,
      districts = [],
      productId,
      options = [],
      optionValues = {},
      bannerColor,
      bannerTitle,
      bannerSubtitle,
      bannerTemplate,
      detailImages = [],
    } = body;

    // 필수 필드 검증
    if (!businessName || !businessType || !contactPhone || !title || !salaryText || !description) {
      return NextResponse.json({ error: "필수 항목을 모두 입력해주세요" }, { status: 400 });
    }

    // BANNER는 전국 노출이므로 지역 선택 불필요
    if (productId !== "BANNER" && (!regions || regions.length === 0)) {
      return NextResponse.json({ error: "노출 지역을 선택해주세요" }, { status: 400 });
    }

    const product = AD_PRODUCTS[productId as AdProductId];
    if (!product) {
      return NextResponse.json({ error: "올바른 상품을 선택해주세요" }, { status: 400 });
    }

    // 지역 수 제한 (BANNER는 전국 노출이므로 skip)
    if (productId !== "BANNER" && regions.length > product.maxRegions) {
      return NextResponse.json(
        { error: `${product.name}은 최대 ${product.maxRegions}개 지역만 선택 가능합니다` },
        { status: 400 }
      );
    }

    // 스탭: 결제/인증/개수 제한 모두 스킵, 즉시 ACTIVE + 90일
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 90);
    const duration = 90 as DurationDays;

    const ad = await prisma.$transaction(async (tx) => {
      const newAd = await tx.ad.create({
        data: {
          userId,
          businessName,
          businessType: businessType as BusinessType,
          contactPhone: contactPhone.replace(/-/g, ""),
          contactKakao: contactKakao || null,
          contactTelegram: contactTelegram || null,
          address: address || null,
          addressDetail: addressDetail || null,
          locationHint: locationHint || null,
          title,
          salaryText,
          workHours: workHours || null,
          benefits: benefits || null,
          description,
          workEnvironment: workEnvironment || null,
          safetyInfo: safetyInfo || null,
          regions: productId === "BANNER" ? [] : (regions as Region[]),
          districts: Array.isArray(districts) ? districts : [],
          productId: productId as AdProductId,
          durationDays: duration,
          totalAmount: 0,
          status: "ACTIVE",
          startDate: now,
          endDate,
          autoJumpPerDay: product.autoJumpPerDay,
          manualJumpPerDay: product.manualJumpPerDay,
          maxEdits: product.maxEdits,
          isVerified: true,
          bannerColor: bannerColor ?? 0,
          bannerTitle: bannerTitle || null,
          bannerSubtitle: bannerSubtitle || null,
          bannerTemplate: bannerTemplate ?? 0,
          detailImages: Array.isArray(detailImages) ? detailImages.slice(0, 10) : [],
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

      return newAd;
    });

    return NextResponse.json({ adId: ad.id, staff: true }, { status: 201 });
  } catch (error) {
    console.error("Staff ad creation error:", error);
    const message = error instanceof Error ? error.message : "서버 오류가 발생했습니다";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
