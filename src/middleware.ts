import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/ads/:path*",
    "/my-resume/:path*",
    "/scraps/:path*",
    "/reviews/:path*",
    "/admin/:path*",
    "/login",
    "/register",
    "/register/business",
  ],
};
