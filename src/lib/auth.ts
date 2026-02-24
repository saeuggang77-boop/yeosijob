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
          return null;
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
