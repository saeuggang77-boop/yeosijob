"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { REGIONS } from "@/lib/constants/regions";
import { BUSINESS_TYPES } from "@/lib/constants/business-types";
import type { Region, BusinessType } from "@/generated/prisma/client";

interface ResumeFilterProps {
  defaultRegion?: Region;
  defaultBusinessType?: BusinessType;
  hasSmartFilter?: boolean;
}

export function ResumeFilter({ defaultRegion, defaultBusinessType, hasSmartFilter }: ResumeFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const region = searchParams.get("region") || defaultRegion || "ALL";
  const businessType = searchParams.get("businessType") || defaultBusinessType || "ALL";
  const experience = searchParams.get("experience") || "ALL";
  const ageRange = searchParams.get("ageRange") || "ALL";

  // Check if smart filter is active (no URL params but has defaults)
  const isSmartFilterActive = hasSmartFilter && !searchParams.get("region") && !searchParams.get("businessType");

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "ALL") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleResetAll = () => {
    router.push(pathname);
  };

  return (
    <div className="space-y-3">
      {/* Smart Filter Banner */}
      {isSmartFilterActive && defaultRegion && defaultBusinessType && (
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/30 rounded-lg p-2.5 flex items-center justify-between gap-3">
          <span className="text-sm">
            🎯 내 업소({REGIONS[defaultRegion]?.label}·{BUSINESS_TYPES[defaultBusinessType]?.label}) 기준으로 필터링 중
          </span>
          <Button
            onClick={handleResetAll}
            variant="ghost"
            size="sm"
            className="h-7 text-xs shrink-0 hover:bg-primary/10"
          >
            전체 보기
          </Button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
      {/* Region Filter */}
      <Select value={region} onValueChange={(v) => handleFilterChange("region", v)}>
        <SelectTrigger className={`h-10 w-[140px] rounded-md border bg-background px-3 text-sm ${region !== "ALL" ? "border-primary text-primary" : ""}`}>
          <SelectValue placeholder="전체 지역" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">전체</SelectItem>
          {Object.entries(REGIONS).map(([key, { label }]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Business Type Filter */}
      <Select
        value={businessType}
        onValueChange={(v) => handleFilterChange("businessType", v)}
      >
        <SelectTrigger className={`h-10 w-[140px] rounded-md border bg-background px-3 text-sm ${businessType !== "ALL" ? "border-primary text-primary" : ""}`}>
          <SelectValue placeholder="전체 업종" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">전체</SelectItem>
          {Object.entries(BUSINESS_TYPES).map(([key, { label }]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Experience Filter */}
      <Select
        value={experience}
        onValueChange={(v) => handleFilterChange("experience", v)}
      >
        <SelectTrigger className={`h-10 w-[140px] rounded-md border bg-background px-3 text-sm ${experience !== "ALL" ? "border-primary text-primary" : ""}`}>
          <SelectValue placeholder="전체 경력" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">전체</SelectItem>
          <SelectItem value="BEGINNER">초보</SelectItem>
          <SelectItem value="EXPERIENCED">경력</SelectItem>
        </SelectContent>
      </Select>

      {/* Age Range Filter */}
      <Select
        value={ageRange}
        onValueChange={(v) => handleFilterChange("ageRange", v)}
      >
        <SelectTrigger className={`h-10 w-[140px] rounded-md border bg-background px-3 text-sm ${ageRange !== "ALL" ? "border-primary text-primary" : ""}`}>
          <SelectValue placeholder="전체 연령" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">전체</SelectItem>
          <SelectItem value="20">20대</SelectItem>
          <SelectItem value="30">30대</SelectItem>
          <SelectItem value="40">40대 이상</SelectItem>
        </SelectContent>
      </Select>
      </div>
    </div>
  );
}
