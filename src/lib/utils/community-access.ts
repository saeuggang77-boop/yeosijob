import { prisma } from "@/lib/prisma";
import { AD_PRODUCTS } from "@/lib/constants/products";

export type CommunityAccessLevel = "full" | "read_only" | "blur";
export type BlurReason = "not_logged_in" | "low_tier_business" | null;

interface SessionLike {
  user: { id: string; role: string };
}

/**
 * 커뮤니티 접근 레벨 판단
 * - JOBSEEKER, ADMIN → "full" (읽기+쓰기)
 * - BUSINESS + 추천 이상(rank≤6) → "read_only" (읽기만)
 * - BUSINESS + 줄광고/무료(rank>6) 또는 광고 없음 → "blur"
 * - 비회원 → "blur"
 */
export async function getCommunityAccess(
  session: SessionLike | null
): Promise<{ level: CommunityAccessLevel; reason: BlurReason }> {
  if (!session) {
    return { level: "blur", reason: "not_logged_in" };
  }

  if (session.user.role === "JOBSEEKER" || session.user.role === "ADMIN") {
    return { level: "full", reason: null };
  }

  if (session.user.role === "BUSINESS") {
    const activeAds = await prisma.ad.findMany({
      where: { userId: session.user.id, status: "ACTIVE" },
      select: { productId: true },
    });

    if (activeAds.length > 0) {
      const bestRank = activeAds.reduce((best, ad) => {
        const rank = AD_PRODUCTS[ad.productId]?.rank ?? 999;
        return rank < best ? rank : best;
      }, 999);

      if (bestRank <= 6) {
        return { level: "read_only", reason: null };
      }
    }

    return { level: "blur", reason: "low_tier_business" };
  }

  return { level: "blur", reason: "not_logged_in" };
}
