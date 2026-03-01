import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ cooldownUntil: null });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentAnonymous = await prisma.post.findFirst({
      where: {
        authorId: session.user.id,
        isAnonymous: true,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    if (recentAnonymous) {
      const end = new Date(recentAnonymous.createdAt);
      end.setDate(end.getDate() + 30);
      return NextResponse.json({ cooldownUntil: end.toISOString() });
    }

    return NextResponse.json({ cooldownUntil: null });
  } catch (error) {
    console.error("Anonymous status error:", error);
    return NextResponse.json({ cooldownUntil: null });
  }
}
