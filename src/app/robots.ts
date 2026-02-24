import type { MetadataRoute } from "next";

const baseUrl = process.env.AUTH_URL || "https://yeosijob.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/business/",
          "/jobseeker/",
          "/login",
          "/register",
          "/register/",
          "/forgot-password",
          "/reset-password",
          "/verify-email",
          "/verify-age/",
          "/api/",
          "/notifications",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
