import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

const CSRF_SKIP_PATHS = ["/api/auth/", "/api/cron/", "/api/payments/webhook"];
const STATE_CHANGING_METHODS = ["POST", "PUT", "DELETE", "PATCH"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // CSRF protection: Origin/Referer validation for state-changing API requests
  if (pathname.startsWith("/api/") && STATE_CHANGING_METHODS.includes(req.method)) {
    if (!CSRF_SKIP_PATHS.some((p) => pathname.startsWith(p))) {
      const origin = req.headers.get("origin");
      const referer = req.headers.get("referer");

      const allowedOrigins = [
        "https://yeosijob.com",
        "https://www.yeosijob.com",
        process.env.NEXT_PUBLIC_BASE_URL,
        "http://localhost:3000",
        "http://localhost:3001",
      ].filter(Boolean) as string[];

      const isValid = origin
        ? allowedOrigins.includes(origin)
        : referer
          ? allowedOrigins.some((o) => referer.startsWith(o))
          : false;

      if (!isValid) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
  }

  // Page routes: NextAuth authorized callback handles auth redirects
});

export const config = {
  matcher: [
    "/business/:path*",
    "/jobseeker/:path*",
    "/notifications",
    "/messages",
    "/messages/:path*",
    "/settings/:path*",
    "/admin/:path*",
    "/login",
    "/register",
    "/register/business",
    "/api/:path*",
  ],
};
