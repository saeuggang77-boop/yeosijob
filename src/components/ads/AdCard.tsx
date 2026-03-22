import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { REGIONS } from "@/lib/constants/regions";
import { BUSINESS_TYPES } from "@/lib/constants/business-types";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/utils/format";
import { calculateDday, getDdayColorClass } from "@/lib/utils/dday";
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
    endDate?: Date | null;
    options?: { optionId: string; value?: string | null }[];
    user?: { totalPaidAdDays: number };
  };
  productId?: string;
  emphasized?: boolean;
}

export function AdCard({ ad, productId, emphasized = false }: AdCardProps) {
  const hasBold = ad.options?.some((o) => o.optionId === "BOLD");
  const highlight = ad.options?.find((o) => o.optionId === "HIGHLIGHT");
  const icon = ad.options?.find((o) => o.optionId === "ICON");
  const ddayInfo = productId !== "FREE" ? calculateDday(ad.endDate) : null;

  const highlightColors: Record<string, string> = {
    yellow: "bg-yellow-500/[0.08]",
    pink: "bg-pink-500/[0.08]",
    blue: "bg-blue-500/[0.08]",
    green: "bg-green-500/[0.08]",
    purple: "bg-purple-500/[0.08]",
    orange: "bg-orange-500/[0.08]",
    red: "bg-red-500/[0.08]",
    cyan: "bg-cyan-500/[0.08]",
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
      case "BANNER": return "border-l-[3px] border-l-primary bg-gradient-to-r from-primary/15 via-primary/5 to-transparent";
      case "VIP": return "border-l-[3px] border-l-primary bg-gradient-to-r from-primary/10 to-transparent";
      case "PREMIUM": return "border-l-[3px] border-l-primary/50";
      case "SPECIAL": return "border-l-[3px] border-l-special";
      case "RECOMMEND": return "border-l-[3px] border-l-recommend";
      case "URGENT": return "border-l-[3px] border-l-urgent bg-urgent/5";
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
        className={cn(
          "flex items-center gap-3 border-b border-border px-4 py-3 transition-colors hover:bg-muted/50",
          productStyles,
          bgClass,
          emphasized && "border-l-[3px] border-l-primary"
        )}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {icon?.value && (
              <span className="shrink-0 text-[14px]">
                {iconEmojis[icon.value] || "🔹"}
              </span>
            )}
            {productId === "URGENT" && (
              <span className="shrink-0 animate-pulse-urgent rounded bg-urgent px-1.5 py-0.5 text-[12px] font-bold text-white">급구</span>
            )}
            {productId === "BANNER" && (
              <span className="shrink-0 rounded bg-gradient-to-br from-primary via-amber to-primary px-1.5 py-0.5 text-[11px] font-extrabold text-primary-foreground shadow-sm">노블레스</span>
            )}
            {productId === "VIP" && (
              <span className="shrink-0 rounded bg-gradient-to-r from-primary to-amber px-1.5 py-0.5 text-[12px] font-bold text-primary-foreground">VIP</span>
            )}
            {productId === "PREMIUM" && (
              <span className="shrink-0 rounded bg-primary/20 px-1.5 py-0.5 text-[12px] font-bold text-primary">PREMIUM</span>
            )}
            {productId === "SPECIAL" && (
              <span className="shrink-0 rounded bg-special/20 px-1.5 py-0.5 text-[12px] font-bold text-special">SPECIAL</span>
            )}
            {productId === "RECOMMEND" && (
              <span className="shrink-0 rounded bg-recommend/20 px-1.5 py-0.5 text-[12px] font-bold text-recommend">추천</span>
            )}
            <h3
              className={`truncate text-[14px] ${
                hasBold || emphasized ? "font-bold" : "font-medium"
              }`}
            >
              {ad.title}
            </h3>
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <span>{ad.businessName}</span>
            <span>·</span>
            <span>{regionLabels}</span>
            <span>·</span>
            <span>{bizLabel}</span>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="max-w-[180px] truncate text-[14px] font-medium text-success" title={ad.salaryText}>{ad.salaryText}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {timeAgo(ad.lastJumpedAt)}
          </p>
          <div className="mt-0.5 flex items-center justify-end gap-1.5">
            {ddayInfo && (
              <Badge
                className={`shrink-0 px-1.5 py-0 text-[10px] font-bold ${getDdayColorClass(ddayInfo.color)}`}
              >
                {ddayInfo.text}
              </Badge>
            )}
            <span className="text-[11px] text-muted-foreground">
              👁 {ad.viewCount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
