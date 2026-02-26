import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSlugFromTitle } from "@/lib/utils/slug";

export async function POST() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const posts = await prisma.post.findMany({
    where: { slug: null },
    select: { id: true, title: true },
    orderBy: { createdAt: "asc" },
  });

  if (posts.length === 0) {
    return NextResponse.json({ message: "모든 게시글에 slug가 있습니다", updated: 0 });
  }

  let updated = 0;
  const usedSlugs = new Set<string>();

  for (const post of posts) {
    const baseSlug = generateSlugFromTitle(post.title);
    let slug = baseSlug;
    let suffix = 2;

    // 메모리 + DB 중복 체크
    while (true) {
      if (!usedSlugs.has(slug)) {
        const existing = await prisma.post.findUnique({
          where: { slug },
          select: { id: true },
        });
        if (!existing) break;
      }
      slug = `${baseSlug}-${suffix}`;
      suffix++;
    }

    await prisma.post.update({
      where: { id: post.id },
      data: { slug },
    });
    usedSlugs.add(slug);
    updated++;
  }

  return NextResponse.json({
    message: `${updated}/${posts.length}개 게시글에 slug 생성 완료`,
    updated,
    total: posts.length,
  });
}
