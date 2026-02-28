import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { REGIONS } from "@/lib/constants/regions";
import { BUSINESS_TYPES } from "@/lib/constants/business-types";

import { calculateDday, getDdayColorClass } from "@/lib/utils/dday";
import type { Region, BusinessType } from "@/generated/prisma/client";

interface AdBoxCardProps {
  ad: {
    id: string;
    title: string;
    businessName: string;
    businessType: BusinessType;
    regions: Region[];
    salaryText: string;
    isVerified: boolean;
    viewCount?: number;
    thumbnailUrl?: string | null;
    bannerColor?: number;
    endDate?: Date | null;
    user?: { totalPaidAdDays: number };
  };
  productId?: string;
  compact?: boolean;
}

export function AdBoxCard({ ad, productId, compact = false }: AdBoxCardProps) {
  const regionLabels = ad.regions
    .map((r) => REGIONS[r]?.shortLabel || r)
    .join(", ");
  const bizLabel = BUSINESS_TYPES[ad.businessType]?.shortLabel || ad.businessType;
  const ddayInfo = productId !== "FREE" ? calculateDday(ad.endDate) : null;

  function getProductStyles(productId?: string) {
    switch (productId) {
      case "VIP": return "border-primary bg-gradient-to-br from-primary/10 to-accent/10";
      case "PREMIUM": return "border-primary/50 bg-primary/5";
      case "SPECIAL": return "border-t-2 border-t-special bg-special/5";
      case "RECOMMEND": return "border-l-4 border-l-recommend";
      case "URGENT": return "border-l-4 border-l-urgent bg-urgent/5";
      default: return "";
    }
  }

  const productStyles = getProductStyles(productId);

  if (compact) {
    return (
      <Link href={`/jobs/${ad.id}`} className="block">
        <div className={`relative w-full overflow-hidden rounded-lg border transition-all duration-200 hover:bg-muted/50 ${productStyles}`}>
          <div className="flex items-center justify-between gap-2 py-2 px-2 sm:gap-3 sm:px-3">
            {/* Left side: title + info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <h3 className="truncate text-sm font-medium">{ad.title}</h3>
                {ad.isVerified && (
                  <Badge variant="secondary" className="shrink-0 text-[10px] px-1 py-0">
                    <span className="text-success">✓</span>
                  </Badge>
                )}

              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {ad.businessName} · {regionLabels} · {bizLabel}
              </p>
            </div>
            {/* Right side: salary + dday */}
            <div className="flex items-center gap-1.5 sm:shrink-0 sm:gap-2">
              <p className="text-xs font-medium text-success truncate sm:text-sm sm:whitespace-nowrap">{ad.salaryText}</p>
              {ddayInfo && (
                <Badge
                  className={`px-1.5 py-0.5 text-[10px] font-bold ${getDdayColorClass(ddayInfo.color)}`}
                >
                  {ddayInfo.text}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/jobs/${ad.id}`} className="block">
      <div className={`relative w-full overflow-hidden rounded-lg border transition-all duration-200 hover:-translate-y-1 hover:bg-muted/50 ${productStyles}`}>
        {/* Content */}
        <div className="p-3">
          {productId === "VIP" && (
            <span className="absolute -top-2 -right-2 rounded bg-gradient-to-r from-primary to-amber px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">VIP</span>
          )}
          {productId === "PREMIUM" && (
            <span className="absolute -top-2 -right-2 rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary">P</span>
          )}
          {ddayInfo && (
            <Badge
              className={`absolute -top-2 -left-2 px-1.5 py-0.5 text-[10px] font-bold ${getDdayColorClass(ddayInfo.color)}`}
            >
              {ddayInfo.text}
            </Badge>
          )}
          <div className="flex items-center gap-1">
            <h3 className="truncate text-sm font-medium">{ad.title}</h3>
            {ad.isVerified && (
              <Badge variant="secondary" className="shrink-0 text-[10px] px-1 py-0">
                <span className="text-success">✓</span>
              </Badge>
            )}
          </div>
          <p className="mt-1 truncate text-xs text-muted-foreground">{ad.businessName}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{regionLabels} · {bizLabel}</p>
          <p className="mt-1 text-sm font-medium text-success">{ad.salaryText}</p>
          {ad.viewCount !== undefined && (
            <p className="mt-0.5 text-[10px] text-muted-foreground">👁 {ad.viewCount.toLocaleString()}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
