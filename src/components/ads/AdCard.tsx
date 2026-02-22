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
  emphasized?: boolean;
}

export function AdCard({ ad, emphasized = false }: AdCardProps) {
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

  const bgClass = highlight?.value
    ? highlightColors[highlight.value] || ""
    : "";

  const regionLabels = ad.regions
    .map((r) => REGIONS[r]?.shortLabel || r)
    .join(", ");

  const bizLabel =
    BUSINESS_TYPES[ad.businessType]?.shortLabel || ad.businessType;

  return (
    <Link href={`/jobs/${ad.id}`} className="block">
      <div
        className={`flex items-center gap-3 border-b px-4 py-3 transition-colors hover:bg-muted/50 ${bgClass} ${emphasized ? "border-l-4 border-l-primary" : ""}`}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {icon?.value && (
              <span className="text-sm">
                {iconEmojis[icon.value] || "🔹"}
              </span>
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
        </div>
      </div>
    </Link>
  );
}
