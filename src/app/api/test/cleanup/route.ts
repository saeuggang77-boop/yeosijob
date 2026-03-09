import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// E2E test account cleanup (dev only)
export async function POST(request: Request) {
  // 프로덕션에서는 완전히 비활성화
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { emails } = await request.json();

  if (!Array.isArray(emails)) {
    return NextResponse.json({ error: "emails array required" }, { status: 400 });
  }

  let deleted = 0;
  for (const email of emails) {
    try {
      // Delete related records first
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        await prisma.verificationToken.deleteMany({ where: { identifier: email } });
        await prisma.post.deleteMany({ where: { authorId: user.id } });
        await prisma.comment.deleteMany({ where: { authorId: user.id } });
        await prisma.notification.deleteMany({ where: { userId: user.id } });
        await prisma.user.delete({ where: { email } });
        deleted++;
      }
    } catch (error) {
      console.error(`Failed to delete ${email}:`, error);
    }
  }

  return NextResponse.json({ message: `Deleted ${deleted} accounts` });
}
