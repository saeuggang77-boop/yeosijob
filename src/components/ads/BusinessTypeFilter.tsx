"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BUSINESS_TYPE_LIST } from "@/lib/constants/business-types";

export function BusinessTypeFilter({ current }: { current?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "ALL") {
      params.delete("businessType");
    } else {
      params.set("businessType", value);
    }
    params.delete("page");
    router.push(`/?${params.toString()}`);
  }

  return (
    <Select value={current || "ALL"} onValueChange={handleChange}>
      <SelectTrigger className="h-9 w-[100px] text-sm">
        <SelectValue placeholder="업종" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">전체 업종</SelectItem>
        {BUSINESS_TYPE_LIST.map((b) => (
          <SelectItem key={b.value} value={b.value}>
            {b.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
