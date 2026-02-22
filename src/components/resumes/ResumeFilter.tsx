"use client";

import { useRouter, useSearchParams } from "next/navigation";
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

  const region = searchParams.get("region") || "";
  const businessType = searchParams.get("businessType") || "";

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page"); // Reset pagination
    router.push(`/resumes?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap gap-3">
      <div className="w-40">
        <Select value={region} onValueChange={(v) => handleFilterChange("region", v)}>
          <SelectTrigger>
            <SelectValue placeholder="지역 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">전체 지역</SelectItem>
            {Object.entries(REGIONS).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-40">
        <Select
          value={businessType}
          onValueChange={(v) => handleFilterChange("businessType", v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="업종 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">전체 업종</SelectItem>
            {Object.entries(BUSINESS_TYPES).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
