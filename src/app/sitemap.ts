import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.AUTH_URL || "https://yeosijob.com";

  // 정적 페이지
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/jobs`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/community`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/notice`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // 활성 광고 (채용정보) 동적 페이지
  const activeAds = await prisma.ad.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: 5000,
  });

  const adPages: MetadataRoute.Sitemap = activeAds.map((ad) => ({
    url: `${baseUrl}/jobs/${ad.id}`,
    lastModified: ad.updatedAt,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  // 커뮤니티 게시글
  const communityPosts = await prisma.post.findMany({
    where: { isHidden: false },
    select: { id: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: 1000,
  });

  const communityPages: MetadataRoute.Sitemap = communityPosts.map((post) => ({
    url: `${baseUrl}/community/${post.id}`,
    lastModified: post.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  // 공지사항 개별 페이지
  const notices = await prisma.notice.findMany({
    select: { id: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });

  const noticePages: MetadataRoute.Sitemap = notices.map((notice) => ({
    url: `${baseUrl}/notice/${notice.id}`,
    lastModified: notice.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.4,
  }));

  return [...staticPages, ...adPages, ...communityPages, ...noticePages];
}
