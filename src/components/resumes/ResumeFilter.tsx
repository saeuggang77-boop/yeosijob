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
import { REGIONS, AD_REGION_LIST } from "@/lib/constants/regions";
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

  const region = searchParams.get("region") || "ALL";
  const businessType = searchParams.get("businessType") || "ALL";
  const experience = searchParams.get("experience") || "ALL";
  const ageRange = searchParams.get("ageRange") || "ALL";
  const contacted = searchParams.get("contacted") || "";

  // Show suggestion banner when smart filter info is available and no filters applied
  const showSmartBanner = hasSmartFilter && !searchParams.get("region") && !searchParams.get("businessType");

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
      {/* Smart Filter Suggestion Banner */}
      {showSmartBanner && defaultRegion && defaultBusinessType && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-blue-500/30 bg-blue-500/10 p-2.5">
          <span className="text-sm">
            🎯 내 광고(<strong>{REGIONS[defaultRegion]?.label}·{BUSINESS_TYPES[defaultBusinessType]?.label}</strong>) 관련 인재 보기
          </span>
          <Button
            onClick={() => {
              const params = new URLSearchParams();
              params.set("region", defaultRegion);
              params.set("businessType", defaultBusinessType);
              params.set("page", "1");
              router.push(`${pathname}?${params.toString()}`);
            }}
            size="sm"
            className="h-7 shrink-0 text-xs"
          >
            필터 적용
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
          {AD_REGION_LIST.map(({ value: key, label }) => (
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

      {/* Contacted Filter */}
      <Button
        variant={contacted === "uncontacted" ? "default" : "outline"}
        size="sm"
        onClick={() => handleFilterChange("contacted", contacted === "uncontacted" ? "ALL" : "uncontacted")}
        className="h-10"
      >
        미연락만
      </Button>
      </div>
    </div>
  );
}
