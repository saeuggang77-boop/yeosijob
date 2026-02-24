import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;

      // 사장님 전용 페이지
      if (pathname.startsWith("/business")) {
        if (!isLoggedIn) return false;
        return auth.user.role === "BUSINESS" || auth.user.role === "ADMIN";
      }

      // 구직자 전용 페이지
      if (
        pathname.startsWith("/my-resume") ||
        pathname.startsWith("/scraps") ||
        pathname.startsWith("/reviews")
      ) {
        if (!isLoggedIn) return false;
        return auth.user.role === "JOBSEEKER" || auth.user.role === "ADMIN";
      }

      // 관리자 전용 페이지
      if (pathname.startsWith("/admin")) {
        if (!isLoggedIn) return false;
        return auth.user.role === "ADMIN";
      }

      // 로그인 페이지 → 이미 로그인된 사용자는 홈으로
      if (pathname === "/login" || pathname === "/register") {
        if (isLoggedIn) {
          return Response.redirect(new URL("/", nextUrl));
        }
        return true;
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
        token.phone = user.phone ?? undefined;
        token.businessName = user.businessName ?? undefined;
        token.isVerifiedBiz = user.isVerifiedBiz;
        token.ageVerified = user.ageVerified
          ? new Date(user.ageVerified).toISOString()
          : undefined;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.phone = token.phone as string | undefined;
        session.user.businessName = token.businessName as string | undefined;
        session.user.isVerifiedBiz = token.isVerifiedBiz as boolean;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).ageVerified = token.ageVerified;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
