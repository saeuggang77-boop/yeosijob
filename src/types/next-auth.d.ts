import type { DefaultSession, DefaultUser } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      phone?: string;
      businessName?: string;
      isVerifiedBiz: boolean;
      ageVerified?: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: string;
    phone?: string | null;
    businessName?: string | null;
    isVerifiedBiz: boolean;
    ageVerified?: Date | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: string;
    phone?: string;
    businessName?: string;
    isVerifiedBiz: boolean;
    ageVerified?: string;
  }
}
