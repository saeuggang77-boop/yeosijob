import { NextResponse } from "next/server";
import crypto from "crypto";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  registerJobseekerSchema,
  registerBusinessSchema,
} from "@/lib/validators/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    // Rate limiting (x-forwarded-for 스푸핑 방지)
    const ip = (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
               request.headers.get("x-real-ip") || "unknown";
    const rateLimitResult = checkRateLimit(`register:${ip}`, 5, 60 * 1000); // 5 requests per minute
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "너무 많은 요청입니다. 잠시 후 다시 시도해주세요." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { type } = body;

    if (type === "BUSINESS") {
      const result = registerBusinessSchema.safeParse(body);
      if (!result.success) {
        return NextResponse.json(
          { error: result.error.issues[0].message },
          { status: 400 }
        );
      }

      const { name, email, phone, password, businessName, businessNumber } =
        result.data;

      const [existing, nameExists, businessNumberExists] = await Promise.all([
        prisma.user.findFirst({
          where: { OR: [{ email }, { phone }] },
        }),
        prisma.user.findFirst({
          where: { name, isActive: true },
          select: { id: true },
        }),
        prisma.user.findFirst({
          where: { businessNumber, isActive: true },
          select: { id: true },
        }),
      ]);
      if (existing) {
        const field = existing.email === email ? "이메일" : "휴대폰 번호";
        return NextResponse.json(
          { error: `이미 사용 중인 ${field}입니다` },
          { status: 409 }
        );
      }
      if (nameExists) {
        return NextResponse.json(
          { error: "이미 사용 중인 닉네임입니다" },
          { status: 409 }
        );
      }
      if (businessNumberExists) {
        return NextResponse.json(
          { error: "이미 등록된 사업자번호입니다" },
          { status: 409 }
        );
      }

      const hashedPassword = await hash(password, 12);
      const user = await prisma.user.create({
        data: {
          name,
          email,
          phone,
          hashedPassword,
          role: "BUSINESS",
          businessName,
          businessNumber,
        },
      });

      // Send verification email (non-blocking)
      const token = crypto.randomUUID();
      await prisma.verificationToken.create({
        data: { identifier: email, token, expires: new Date(Date.now() + 24 * 60 * 60 * 1000) },
      });
      sendVerificationEmail(email, token).catch((err) => {
        console.error("Email send failed:", err);
      });

      return NextResponse.json(
        { message: "회원가입이 완료되었습니다. 이메일 인증 링크를 발송했습니다.", userId: user.id },
        { status: 201 }
      );
    } else {
      const result = registerJobseekerSchema.safeParse(body);
      if (!result.success) {
        return NextResponse.json(
          { error: result.error.issues[0].message },
          { status: 400 }
        );
      }

      const { name, email, phone, password } = result.data;

      const [existing, nameExists] = await Promise.all([
        prisma.user.findFirst({
          where: { OR: [{ email }, { phone }] },
        }),
        prisma.user.findFirst({
          where: { name, isActive: true },
          select: { id: true },
        }),
      ]);
      if (existing) {
        const field = existing.email === email ? "이메일" : "휴대폰 번호";
        return NextResponse.json(
          { error: `이미 사용 중인 ${field}입니다` },
          { status: 409 }
        );
      }
      if (nameExists) {
        return NextResponse.json(
          { error: "이미 사용 중인 닉네임입니다" },
          { status: 409 }
        );
      }

      const hashedPassword = await hash(password, 12);
      const user = await prisma.user.create({
        data: {
          name,
          email,
          phone,
          hashedPassword,
          role: "JOBSEEKER",
        },
      });

      // Send verification email (non-blocking)
      const token = crypto.randomUUID();
      await prisma.verificationToken.create({
        data: { identifier: email, token, expires: new Date(Date.now() + 24 * 60 * 60 * 1000) },
      });
      sendVerificationEmail(email, token).catch((err) => {
        console.error("Email send failed:", err);
      });

      return NextResponse.json(
        { message: "회원가입이 완료되었습니다. 이메일 인증 링크를 발송했습니다.", userId: user.id },
        { status: 201 }
      );
    }
  } catch (error) {
    // P2002: Unique constraint violation
    if (error instanceof Error && 'code' in error && (error as any).code === 'P2002') {
      return NextResponse.json(
        { error: "이미 사용 중인 이메일 또는 전화번호입니다" },
        { status: 409 }
      );
    }
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
