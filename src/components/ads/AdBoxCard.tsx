import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { REGIONS } from "@/lib/constants/regions";
import { BUSINESS_TYPES } from "@/lib/constants/business-types";
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
  };
  productId?: string;
}

export function AdBoxCard({ ad, productId }: AdBoxCardProps) {
  const regionLabels = ad.regions
    .map((r) => REGIONS[r]?.shortLabel || r)
    .join(", ");
  const bizLabel = BUSINESS_TYPES[ad.businessType]?.shortLabel || ad.businessType;

  function getProductStyles(productId?: string) {
    switch (productId) {
      case "VIP": return "border-primary";
      case "PREMIUM": return "bg-primary/5";
      default: return "";
    }
  }

  const productStyles = getProductStyles(productId);

  return (
    <Link href={`/jobs/${ad.id}`} className="block">
      <div className={`w-44 shrink-0 rounded-lg border p-3 transition-all duration-200 hover:-translate-y-1 hover:bg-muted/50 sm:w-auto ${productStyles}`}>
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
        <p className="mt-1 text-sm font-medium text-primary">{ad.salaryText}</p>
      </div>
    </Link>
  );
}
