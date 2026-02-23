import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  registerJobseekerSchema,
  registerBusinessSchema,
} from "@/lib/validators/auth";

export async function POST(request: Request) {
  try {
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

      const existing = await prisma.user.findFirst({
        where: { OR: [{ email }, { phone }] },
      });
      if (existing) {
        const field = existing.email === email ? "이메일" : "휴대폰 번호";
        return NextResponse.json(
          { error: `이미 사용 중인 ${field}입니다` },
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

      return NextResponse.json(
        { message: "회원가입이 완료되었습니다", userId: user.id },
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

      const existing = await prisma.user.findFirst({
        where: { OR: [{ email }, { phone }] },
      });
      if (existing) {
        const field = existing.email === email ? "이메일" : "휴대폰 번호";
        return NextResponse.json(
          { error: `이미 사용 중인 ${field}입니다` },
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

      return NextResponse.json(
        { message: "회원가입이 완료되었습니다", userId: user.id },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
