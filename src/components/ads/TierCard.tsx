import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { REGIONS } from "@/lib/constants/regions";
import { BUSINESS_TYPES } from "@/lib/constants/business-types";
import { getBannerUrl } from "@/lib/constants/banner-themes";
import type { Region, BusinessType } from "@/generated/prisma/client";

interface TierCardProps {
  ad: {
    id: string;
    title: string;
    businessName: string;
    businessType: BusinessType;
    regions: Region[];
    salaryText: string;
    isVerified: boolean;
    viewCount: number;
    thumbnailUrl?: string | null;
    description?: string | null;
    bannerColor?: number;
  };
  tier: "VIP" | "PREMIUM" | "SPECIAL";
}

const tierStyles = {
  VIP: {
    card: "border-2 border-primary bg-gradient-to-r from-primary/10 to-accent/10 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/20",
    badge: "bg-gradient-to-r from-primary to-amber text-primary-foreground",
    badgeText: "VIP",
  },
  PREMIUM: {
    card: "border border-primary/40 border-t-4 border-t-primary bg-card hover:-translate-y-1 hover:shadow-md",
    badge: "bg-primary/20 text-primary",
    badgeText: "PREMIUM",
  },
  SPECIAL: {
    card: "border border-l-4 border-l-special bg-card hover:-translate-y-0.5 hover:bg-special/5",
    badge: "bg-special/20 text-special",
    badgeText: "SPECIAL",
  },
} as const;

export function TierCard({ ad, tier }: TierCardProps) {
  const style = tierStyles[tier];
  const regionLabels = ad.regions.map((r) => REGIONS[r]?.shortLabel || r).join(", ");
  const bizInfo = BUSINESS_TYPES[ad.businessType];
  const bizLabel = bizInfo?.shortLabel || ad.businessType;
  const bizIcon = bizInfo?.icon || "📋";
  const oneLiner = ad.description?.split("\n")[0]?.slice(0, 60) || null;

  return (
    <Link href={`/jobs/${ad.id}`} className="block">
      <div
        className={`flex gap-3 rounded-lg p-4 transition-all duration-200 ${style.card}`}
      >
        {/* Banner Image with CSS-only fallback */}
        <div className="relative flex h-[120px] w-[200px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
          <span className="text-2xl">{bizIcon}</span>
          <img
            src={getBannerUrl(ad, 200, 120)}
            alt={`${ad.businessName} 배너`}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span
              className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold ${style.badge}`}
            >
              {tier === "PREMIUM" && "⭐ "}
              {style.badgeText}
            </span>
            <h3 className="truncate text-sm font-bold">{ad.title}</h3>
            {ad.isVerified && (
              <Badge
                variant="secondary"
                className="shrink-0 px-1 py-0 text-[10px]"
              >
                인증
              </Badge>
            )}
          </div>

          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {ad.businessName} · {regionLabels} · {bizLabel}
          </p>

          {oneLiner && (
            <p className="mt-1 truncate text-xs text-muted-foreground/80">
              {oneLiner}
            </p>
          )}

          <div className="mt-1.5 flex items-center justify-between">
            <p className="text-sm font-bold text-success">{ad.salaryText}</p>
            <p className="text-[10px] text-muted-foreground">
              조회 {ad.viewCount.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
