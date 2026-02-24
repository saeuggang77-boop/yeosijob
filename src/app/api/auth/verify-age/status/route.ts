import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("age_token")?.value;

    if (!token) {
      return NextResponse.json({ verified: false });
    }

    const verification = await prisma.ageVerification.findUnique({
      where: { token },
    });

    if (!verification) {
      const response = NextResponse.json({ verified: false });
      response.cookies.delete("age_token");
      return response;
    }

    if (verification.expiresAt < new Date()) {
      await prisma.ageVerification.delete({ where: { token } });
      const response = NextResponse.json({ verified: false, expired: true });
      response.cookies.delete("age_token");
      return response;
    }

    return NextResponse.json({ verified: true });
  } catch (error) {
    console.error("Age verification status error:", error);
    return NextResponse.json({ verified: false });
  }
}
