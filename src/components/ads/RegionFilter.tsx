"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { REGION_LIST } from "@/lib/constants/regions";

export function RegionFilter({ current }: { current?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "ALL") {
      params.delete("region");
    } else {
      params.set("region", value);
    }
    params.delete("page");
    router.push(`/?${params.toString()}`);
  }

  return (
    <Select value={current || "ALL"} onValueChange={handleChange}>
      <SelectTrigger className="h-9 w-[100px] text-sm">
        <SelectValue placeholder="지역" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">전체 지역</SelectItem>
        {REGION_LIST.map((r) => (
          <SelectItem key={r.value} value={r.value}>
            {r.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
