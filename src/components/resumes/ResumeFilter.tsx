"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { REGIONS } from "@/lib/constants/regions";
import { BUSINESS_TYPES } from "@/lib/constants/business-types";

export function ResumeFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const region = searchParams.get("region") || "";
  const businessType = searchParams.get("businessType") || "";
  const experience = searchParams.get("experience") || "";
  const ageRange = searchParams.get("ageRange") || "";

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1"); // Reset to page 1
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {/* Region Filter */}
      <Select value={region} onValueChange={(v) => handleFilterChange("region", v)}>
        <SelectTrigger className="h-10 w-[140px] rounded-md border bg-background px-3 text-sm">
          <SelectValue placeholder="전체 지역" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">전체</SelectItem>
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
        <SelectTrigger className="h-10 w-[140px] rounded-md border bg-background px-3 text-sm">
          <SelectValue placeholder="전체 업종" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">전체</SelectItem>
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
        <SelectTrigger className="h-10 w-[140px] rounded-md border bg-background px-3 text-sm">
          <SelectValue placeholder="전체 경력" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">전체</SelectItem>
          <SelectItem value="BEGINNER">초보</SelectItem>
          <SelectItem value="EXPERIENCED">경력</SelectItem>
        </SelectContent>
      </Select>

      {/* Age Range Filter */}
      <Select
        value={ageRange}
        onValueChange={(v) => handleFilterChange("ageRange", v)}
      >
        <SelectTrigger className="h-10 w-[140px] rounded-md border bg-background px-3 text-sm">
          <SelectValue placeholder="전체 연령" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">전체</SelectItem>
          <SelectItem value="20">20대</SelectItem>
          <SelectItem value="30">30대</SelectItem>
          <SelectItem value="40">40대 이상</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
