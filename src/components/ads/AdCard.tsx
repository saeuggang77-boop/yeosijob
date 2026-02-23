import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { REGIONS } from "@/lib/constants/regions";
import { BUSINESS_TYPES } from "@/lib/constants/business-types";
import { timeAgo } from "@/lib/utils/format";
import type { Region, BusinessType } from "@/generated/prisma/client";

interface AdCardProps {
  ad: {
    id: string;
    title: string;
    businessName: string;
    businessType: BusinessType;
    regions: Region[];
    salaryText: string;
    isVerified: boolean;
    viewCount: number;
    lastJumpedAt: Date | string;
    options?: { optionId: string; value?: string | null }[];
  };
  productId?: string;
  emphasized?: boolean;
}

export function AdCard({ ad, productId, emphasized = false }: AdCardProps) {
  const hasBold = ad.options?.some((o) => o.optionId === "BOLD");
  const highlight = ad.options?.find((o) => o.optionId === "HIGHLIGHT");
  const icon = ad.options?.find((o) => o.optionId === "ICON");

  const highlightColors: Record<string, string> = {
    yellow: "bg-yellow-50",
    pink: "bg-pink-50",
    blue: "bg-blue-50",
    green: "bg-green-50",
    purple: "bg-purple-50",
    orange: "bg-orange-50",
    red: "bg-red-50",
    cyan: "bg-cyan-50",
  };

  const iconEmojis: Record<string, string> = {
    "1": "🔥",
    "2": "💎",
    "3": "⭐",
    "4": "🎯",
    "5": "💰",
    "6": "👑",
    "7": "🎀",
    "8": "✨",
    "9": "🌟",
    "10": "💜",
  };

  function getProductStyles(productId?: string) {
    switch (productId) {
      case "LINE": return "";
      case "RECOMMEND": return "border-l-4 border-l-recommend";
      case "URGENT": return "bg-urgent/5 border-l-4 border-l-urgent";
      case "SPECIAL": return "border-t-2 border-t-special bg-special/5";
      case "PREMIUM": return "border border-primary/50 bg-primary/5";
      case "VIP": return "border border-primary bg-gradient-to-r from-primary/10 to-accent/10";
      default: return "";
    }
  }

  const bgClass = highlight?.value
    ? highlightColors[highlight.value] || ""
    : "";

  const productStyles = getProductStyles(productId);

  const regionLabels = ad.regions
    .map((r) => REGIONS[r]?.shortLabel || r)
    .join(", ");

  const bizLabel =
    BUSINESS_TYPES[ad.businessType]?.shortLabel || ad.businessType;

  return (
    <Link href={`/jobs/${ad.id}`} className="block">
      <div
        className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50 ${bgClass} ${productStyles} ${emphasized ? "border-l-4 border-l-primary" : ""}`}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {icon?.value && (
              <span className="text-sm">
                {iconEmojis[icon.value] || "🔹"}
              </span>
            )}
            {productId === "URGENT" && (
              <span className="animate-pulse-urgent rounded bg-urgent px-1.5 py-0.5 text-xs font-bold text-white">급구</span>
            )}
            {productId === "VIP" && (
              <span className="rounded bg-gradient-to-r from-primary to-amber px-1.5 py-0.5 text-xs font-bold text-primary-foreground">VIP</span>
            )}
            {productId === "PREMIUM" && (
              <span className="rounded bg-primary/20 px-1.5 py-0.5 text-xs font-bold text-primary">PREMIUM</span>
            )}
            <h3
              className={`truncate text-sm ${
                hasBold || emphasized ? "font-bold" : "font-medium"
              }`}
            >
              {ad.title}
            </h3>
            {ad.isVerified && (
              <Badge
                variant="secondary"
                className="shrink-0 text-[10px] px-1 py-0"
              >
                인증
              </Badge>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>{ad.businessName}</span>
            <span>·</span>
            <span>{regionLabels}</span>
            <span>·</span>
            <span>{bizLabel}</span>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-sm font-medium text-primary">{ad.salaryText}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {timeAgo(ad.lastJumpedAt)}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            👁 {ad.viewCount.toLocaleString()}
          </p>
        </div>
      </div>
    </Link>
  );
}
