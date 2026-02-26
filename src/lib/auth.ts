import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import KakaoProvider from "next-auth/providers/kakao";
import GoogleProvider from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";

interface ExtendedUser {
  id?: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  role?: string;
  phone?: string | null;
  businessName?: string | null;
  isVerifiedBiz?: boolean;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  trustHost: true,
  session: { strategy: "jwt" },
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      const oauthProviders = ["kakao", "google"];
      if (account?.provider && oauthProviders.includes(account.provider)) {
        if (!user.email) return false;

        const defaultNames: Record<string, string> = {
          kakao: "카카오 사용자",
          google: "구글 사용자",
        };

        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        // OAuth 활동정지 체크 (기존 유저)
        if (existingUser && !existingUser.isActive) {
          // suspendedUntil이 있는 경우 기간 체크, 없으면 영구 정지
          if (existingUser.suspendedUntil) {
            const now = new Date();
            const isFarFuture = existingUser.suspendedUntil.getFullYear() >= 9999;

            if (!isFarFuture && existingUser.suspendedUntil < now) {
              // 기간 만료 → 자동 해제
              await prisma.user.update({
                where: { id: existingUser.id },
                data: { isActive: true, suspendedUntil: null, suspendReason: null },
              });
              await prisma.notification.create({
                data: {
                  userId: existingUser.id,
                  title: "활동정지 해제",
                  message: "활동정지 기간이 만료되어 자동 해제되었습니다.",
                },
              }).catch(() => {});
            } else {
              // 아직 정지 중
              return false;
            }
          } else {
            // suspendedUntil이 null = 영구 정지
            return false;
          }
        }

        if (!existingUser) {
          const newUser = await prisma.user.create({
            data: {
              email: user.email,
              name: user.name || defaultNames[account.provider] || "소셜 사용자",
              image: user.image,
              role: "JOBSEEKER",
              emailVerified: new Date(),
            },
          });
          user.id = newUser.id;
          (user as ExtendedUser).role = newUser.role;
          (user as ExtendedUser).isVerifiedBiz = false;
        } else {
          user.id = existingUser.id;
          (user as ExtendedUser).role = existingUser.role;
          (user as ExtendedUser).phone = existingUser.phone;
          (user as ExtendedUser).businessName = existingUser.businessName;
          (user as ExtendedUser).isVerifiedBiz = existingUser.isVerifiedBiz;
        }

        // Upsert account link
        await prisma.account.upsert({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          },
          update: {
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            expires_at: account.expires_at,
          },
          create: {
            userId: user.id!,
            type: account.type,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            expires_at: account.expires_at,
            token_type: account.token_type,
            scope: account.scope,
            id_token: account.id_token,
          },
        });
      }
      return true;
    },
  },
  providers: [
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID || "",
      clientSecret: process.env.KAKAO_CLIENT_SECRET || "",
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "이메일", type: "email" },
        password: { label: "비밀번호", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.hashedPassword) {
          return null;
        }

        if (!user.isActive) {
          // 활동정지 자동 해제 체크
          if (user.suspendedUntil) {
            const now = new Date();
            const isFarFuture = user.suspendedUntil.getFullYear() >= 9999;

            if (!isFarFuture && user.suspendedUntil < now) {
              // 기간 만료 → 자동 해제
              await prisma.user.update({
                where: { id: user.id },
                data: { isActive: true, suspendedUntil: null, suspendReason: null },
              });
              await prisma.notification.create({
                data: {
                  userId: user.id,
                  title: "활동정지 해제",
                  message: "활동정지 기간이 만료되어 자동 해제되었습니다.",
                },
              }).catch(() => {});
              // 해제 후 로그인 허용 → 아래로 진행
            } else {
              // 아직 정지 중 → 로그인 거부
              throw new Error("활동정지 중입니다. 정지 기간: " + user.suspendedUntil.toLocaleDateString("ko-KR"));
            }
          } else {
            // suspendedUntil이 null = 영구 정지
            throw new Error("계정이 영구 정지되었습니다");
          }
        }

        const isValid = await compare(password, user.hashedPassword);
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          phone: user.phone,
          businessName: user.businessName,
          isVerifiedBiz: user.isVerifiedBiz,
        };
      },
    }),
  ],
});
