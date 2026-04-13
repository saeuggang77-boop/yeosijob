import Link from "next/link";
import Image from "next/image";
import { PARTNER_CATEGORIES } from "@/lib/constants/partners";
import { REGIONS } from "@/lib/constants/regions";
import type { PartnerCategory, Region } from "@/generated/prisma/client";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";

interface PartnerCardProps {
  partner: {
    id: string;
    name: string;
    category: PartnerCategory;
    region: Region;
    description: string;
    highlight: string | null;
    thumbnailUrl: string | null;
    viewCount: number;
  };
}

export function PartnerCard({ partner }: PartnerCardProps) {
  const categoryInfo = PARTNER_CATEGORIES[partner.category];
  const regionLabel = REGIONS[partner.region]?.label || partner.region;
  const catColor = categoryInfo?.color || "#6b7280";

  return (
    <Link href={`/partner/${partner.id}`} className="block h-full">
      <div
        className="flex h-full gap-4 rounded-lg border-2 p-4 transition-all duration-200 hover:shadow-md"
        style={{ borderColor: `${catColor}40`, background: `linear-gradient(135deg, ${catColor}08, transparent)` }}
      >
        {/* Thumbnail */}
        <div className="h-[120px] w-[180px] shrink-0 overflow-hidden rounded-lg bg-muted">
          {partner.thumbnailUrl ? (
            <Image
              src={partner.thumbnailUrl}
              alt={partner.name}
              width={180}
              height={120}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl">
              {categoryInfo?.emoji || "📦"}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1 flex flex-col">
          {/* Header: name */}
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="min-w-0 truncate text-lg font-bold" style={{ color: catColor }}>
              {partner.name}
            </h3>
          </div>

          {/* Category + Region */}
          <div className="mt-1 flex items-center gap-2">
            <Badge
              style={{ backgroundColor: catColor }}
              className="shrink-0 px-2 py-0.5 text-[10px] text-white border-0"
            >
              {categoryInfo?.emoji} {categoryInfo?.label}
            </Badge>
            <span className="text-xs text-muted-foreground">{regionLabel}</span>
          </div>

          {/* Highlight text */}
          {partner.highlight && (
            <p className="mt-2 text-sm font-semibold text-primary">
              {partner.highlight}
            </p>
          )}

          {/* Description */}
          {partner.description && (
            <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
              {partner.description}
            </p>
          )}

          {/* View count */}
          <div className="mt-2 flex items-center justify-end">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Eye className="h-3 w-3" />
              {partner.viewCount.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
