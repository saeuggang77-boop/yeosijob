import Link from "next/link";
import Image from "next/image";
import { PARTNER_CATEGORIES } from "@/lib/constants/partners";
import { REGIONS } from "@/lib/constants/regions";
import type { PartnerGrade, PartnerCategory, Region } from "@/generated/prisma/client";
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
    grade: PartnerGrade;
    viewCount: number;
  };
}

export function PartnerCard({ partner }: PartnerCardProps) {
  const categoryInfo = PARTNER_CATEGORIES[partner.category];
  const regionLabel = REGIONS[partner.region]?.label || partner.region;

  // Grade styles
  const gradeStyles = {
    A: {
      card: "border-2 bg-gradient-to-br from-[#D4A853]/10 via-background to-background hover:shadow-lg hover:shadow-[#D4A853]/20",
      borderColor: "border-[#D4A853]",
      nameColor: "text-[#D4A853]",
      badgeClass: "bg-gradient-to-r from-[#D4A853] to-amber-600 text-white border-0",
    },
    B: {
      card: "border-2 bg-gradient-to-br from-[#9CA3AF]/10 via-background to-background hover:shadow-md hover:shadow-[#9CA3AF]/20",
      borderColor: "border-[#9CA3AF]",
      nameColor: "text-[#9CA3AF]",
      badgeClass: "bg-gradient-to-r from-[#9CA3AF] to-gray-500 text-white border-0",
    },
    C: {
      card: "border bg-gradient-to-br from-[#78716C]/5 to-background hover:shadow-sm",
      borderColor: "border-[#78716C]",
      nameColor: "text-foreground",
      badgeClass: "bg-[#78716C] text-white border-0",
    },
    D: {
      card: "border border-border/50 bg-card hover:bg-muted/30",
      borderColor: "border-border/50",
      nameColor: "text-muted-foreground",
      badgeClass: "bg-[#444] text-white border-0",
    },
  };

  const style = gradeStyles[partner.grade];

  return (
    <Link href={`/partner/${partner.id}`} className="block h-full">
      <div
        className={`flex h-full gap-4 rounded-lg p-4 transition-all duration-200 ${style.card} ${style.borderColor}`}
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
              {categoryInfo.emoji}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1 flex flex-col">
          {/* Header: name + badges */}
          <div className="flex items-center gap-2 min-w-0">
            <h3 className={`min-w-0 truncate text-lg font-bold ${style.nameColor}`}>
              {partner.name}
            </h3>
          </div>

          {/* Category + Region */}
          <div className="mt-1 flex items-center gap-2">
            <Badge
              style={{ backgroundColor: categoryInfo.color }}
              className="shrink-0 px-2 py-0.5 text-[10px] text-white border-0"
            >
              {categoryInfo.emoji} {categoryInfo.label}
            </Badge>
            <span className="text-xs text-muted-foreground">{regionLabel}</span>
          </div>

          {/* Highlight text (in grade color if A) */}
          {partner.highlight && (
            <p
              className={`mt-2 text-sm font-semibold ${
                partner.grade === "A" ? "text-[#D4A853]" : "text-primary"
              }`}
            >
              {partner.highlight}
            </p>
          )}

          {/* Description (1 line) */}
          <p className="mt-1 flex-1 line-clamp-2 text-sm text-muted-foreground">
            {partner.description}
          </p>

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
