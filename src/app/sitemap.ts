import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const baseUrl = process.env.AUTH_URL || "https://yeosijob.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/jobs`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/resumes`,
      lastModified: new Date(),
      changeFrequency: "daily",
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
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/terms`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${baseUrl}/privacy`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  // Dynamic: active job postings
  const activeAds = await prisma.ad.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, updatedAt: true },
    orderBy: { lastJumpedAt: "desc" },
  });

  const jobPages: MetadataRoute.Sitemap = activeAds.map((ad) => ({
    url: `${baseUrl}/jobs/${ad.id}`,
    lastModified: ad.updatedAt,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  // Dynamic: community posts (최근 90일, 숨김 제외)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const communityPosts = await prisma.post.findMany({
    where: {
      isHidden: false,
      deletedAt: null,
      createdAt: { gte: ninetyDaysAgo },
    },
    select: { id: true, slug: true, updatedAt: true },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const communityPages: MetadataRoute.Sitemap = communityPosts.map((post) => ({
    url: `${baseUrl}/community/${post.slug || post.id}`,
    lastModified: post.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  // Dynamic: active partner pages
  const activePartners = await prisma.partner.findMany({
    where: { status: "ACTIVE", isProfileComplete: true },
    select: { id: true, updatedAt: true },
  });

  const partnerPages: MetadataRoute.Sitemap = activePartners.map((p) => ({
    url: `${baseUrl}/partner/${p.id}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // Dynamic: notice pages
  const notices = await prisma.notice.findMany({
    select: { id: true, updatedAt: true },
    orderBy: { createdAt: "desc" },
  });

  const noticePages: MetadataRoute.Sitemap = notices.map((n) => ({
    url: `${baseUrl}/notice/${n.id}`,
    lastModified: n.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.4,
  }));

  return [...staticPages, ...jobPages, ...communityPages, ...partnerPages, ...noticePages];
}
