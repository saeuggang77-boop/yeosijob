"use client";

import { getBannerDesign, BANNER_COLORS } from "@/lib/constants/banner-themes";
import { BUSINESS_TYPES } from "@/lib/constants/business-types";
import { REGIONS } from "@/lib/constants/regions";
import type { BannerLayout, BannerPattern } from "@/lib/constants/banner-themes";

interface Props {
  businessName?: string;
  businessType?: string;
  regions?: string[];
  salaryText?: string;
  bannerColor: number;
  adId?: string;
}

export function BannerPreview({
  businessName = "업소명",
  businessType = "KARAOKE",
  regions = [],
  salaryText = "급여 정보",
  bannerColor,
  adId,
}: Props) {
  // Use adId or temporary seed for preview
  const seed = adId || `preview-${Date.now()}`;
  const design = getBannerDesign(seed, bannerColor);

  const businessInfo = BUSINESS_TYPES[businessType as keyof typeof BUSINESS_TYPES] || BUSINESS_TYPES.KARAOKE;
  const regionLabels = regions.map((r) => REGIONS[r as keyof typeof REGIONS]?.shortLabel || r).join(", ");

  return (
    <div className="w-full overflow-hidden rounded-lg" style={{ height: "140px" }}>
      <div
        className="relative h-full w-full"
        style={{
          backgroundColor: design.color.bg,
          background: getBackgroundStyle(design.layout, design.pattern, design.color),
        }}
      >
        {/* Content Layer */}
        <div className="relative z-10 h-full w-full p-4">
          {renderLayout(design.layout, {
            businessName,
            businessIcon: businessInfo.icon,
            businessLabel: businessInfo.shortLabel,
            regionLabels,
            salaryText,
            color: design.color,
          })}
        </div>

        {/* Pattern Overlay */}
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={getPatternOverlay(design.pattern, design.color)}
        />
      </div>
    </div>
  );
}

function getBackgroundStyle(layout: BannerLayout, pattern: BannerPattern, color: typeof BANNER_COLORS[0]) {
  const { main, sub, bg } = color;

  // Base gradient based on layout
  if (layout === "diagonal") {
    return `linear-gradient(135deg, ${bg} 0%, ${main}15 100%)`;
  }
  if (layout === "split") {
    return `linear-gradient(90deg, ${bg} 0%, ${bg} 50%, ${main}10 50%, ${main}10 100%)`;
  }
  if (layout === "minimal") {
    return bg;
  }

  // Default radial gradient
  return `radial-gradient(circle at 30% 50%, ${main}20 0%, ${bg} 60%)`;
}

function getPatternOverlay(pattern: BannerPattern, color: typeof BANNER_COLORS[0]) {
  const { main, sub } = color;

  switch (pattern) {
    case "diagonal-stripes":
      return {
        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, ${main}08 10px, ${main}08 20px)`,
      };
    case "dots":
      return {
        backgroundImage: `radial-gradient(circle, ${sub}15 1px, transparent 1px)`,
        backgroundSize: "20px 20px",
      };
    case "grid":
      return {
        backgroundImage: `linear-gradient(${main}10 1px, transparent 1px), linear-gradient(90deg, ${main}10 1px, transparent 1px)`,
        backgroundSize: "30px 30px",
      };
    case "waves":
      return {
        backgroundImage: `repeating-radial-gradient(circle at 0 0, transparent 0, ${main}08 10px, transparent 20px)`,
      };
    case "spotlight":
      return {
        background: `radial-gradient(circle at 80% 20%, ${sub}25 0%, transparent 50%)`,
      };
    case "corner-glow":
      return {
        background: `radial-gradient(circle at 100% 0%, ${main}20 0%, transparent 40%), radial-gradient(circle at 0% 100%, ${sub}15 0%, transparent 40%)`,
      };
    case "vignette":
      return {
        background: `radial-gradient(ellipse at center, transparent 30%, ${main}30 100%)`,
      };
    default:
      return {};
  }
}

function renderLayout(
  layout: BannerLayout,
  data: {
    businessName: string;
    businessIcon: string;
    businessLabel: string;
    regionLabels: string;
    salaryText: string;
    color: typeof BANNER_COLORS[0];
  }
) {
  const { businessName, businessIcon, businessLabel, regionLabels, salaryText, color } = data;

  switch (layout) {
    case "centered":
      return (
        <div className="flex h-full flex-col items-center justify-center text-center">
          <div className="text-3xl mb-2">{businessIcon}</div>
          <h3 className="text-xl font-bold" style={{ color: color.main }}>
            {businessName}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">{businessLabel}</p>
          <p className="text-sm font-semibold mt-2" style={{ color: color.sub }}>
            {salaryText}
          </p>
        </div>
      );

    case "left-aligned":
      return (
        <div className="flex h-full flex-col justify-center">
          <div className="flex items-center gap-3">
            <div className="text-4xl">{businessIcon}</div>
            <div>
              <h3 className="text-xl font-bold" style={{ color: color.main }}>
                {businessName}
              </h3>
              <p className="text-xs text-muted-foreground">{businessLabel}</p>
            </div>
          </div>
          <p className="text-sm font-semibold mt-3" style={{ color: color.sub }}>
            💰 {salaryText}
          </p>
          {regionLabels && (
            <p className="text-xs text-muted-foreground mt-1">📍 {regionLabels}</p>
          )}
        </div>
      );

    case "split":
      return (
        <div className="grid h-full grid-cols-2 gap-4">
          <div className="flex flex-col justify-center">
            <div className="text-3xl mb-2">{businessIcon}</div>
            <h3 className="text-lg font-bold" style={{ color: color.main }}>
              {businessName}
            </h3>
            <p className="text-xs text-muted-foreground">{businessLabel}</p>
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-sm font-semibold" style={{ color: color.sub }}>
              {salaryText}
            </p>
            {regionLabels && (
              <p className="text-xs text-muted-foreground mt-2">{regionLabels}</p>
            )}
          </div>
        </div>
      );

    case "badge-top":
      return (
        <div className="flex h-full flex-col">
          <div
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
            style={{
              backgroundColor: `${color.main}20`,
              color: color.main,
              alignSelf: "flex-start",
            }}
          >
            {businessIcon} {businessLabel}
          </div>
          <div className="mt-3 flex-1">
            <h3 className="text-xl font-bold" style={{ color: color.main }}>
              {businessName}
            </h3>
            <p className="text-sm font-semibold mt-2" style={{ color: color.sub }}>
              {salaryText}
            </p>
            {regionLabels && (
              <p className="text-xs text-muted-foreground mt-1">{regionLabels}</p>
            )}
          </div>
        </div>
      );

    case "diagonal":
      return (
        <div className="flex h-full items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-3xl">{businessIcon}</span>
              <h3 className="text-xl font-bold" style={{ color: color.main }}>
                {businessName}
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{businessLabel}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold" style={{ color: color.sub }}>
              {salaryText}
            </p>
            {regionLabels && (
              <p className="text-xs text-muted-foreground mt-1">{regionLabels}</p>
            )}
          </div>
        </div>
      );

    case "minimal":
      return (
        <div className="flex h-full items-center gap-4">
          <div className="text-4xl">{businessIcon}</div>
          <div className="flex-1">
            <h3 className="text-lg font-bold" style={{ color: color.main }}>
              {businessName}
            </h3>
            <p className="text-sm font-medium mt-1" style={{ color: color.sub }}>
              {salaryText}
            </p>
          </div>
        </div>
      );

    default:
      return null;
  }
}
