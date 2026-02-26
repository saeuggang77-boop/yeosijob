import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const slug = req.nextUrl.searchParams.get("slug") || "";
  const decoded = decodeURIComponent(slug);

  // 1. findFirst로 slug 조회
  const byFindFirst = await prisma.post.findFirst({
    where: { slug: decoded },
    select: { id: true, slug: true, title: true },
  });

  // 2. 전체 slug 목록 (상위 5개)
  const allSlugs = await prisma.post.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    select: { id: true, slug: true, title: true },
  });

  return NextResponse.json({
    inputSlug: slug,
    decodedSlug: decoded,
    slugLength: decoded.length,
    found: !!byFindFirst,
    result: byFindFirst,
    sampleSlugs: allSlugs,
  });
}
