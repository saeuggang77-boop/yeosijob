"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { REGION_LIST } from "@/lib/constants/regions";

export function RegionChips({ current }: { current?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleClick(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "ALL") {
      params.delete("region");
    } else {
      params.set("region", value);
    }
    params.delete("page");
    router.push(`/?${params.toString()}`);
  }

  const selected = current || "ALL";

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      <button
        onClick={() => handleClick("ALL")}
        className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
          selected === "ALL"
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground hover:bg-muted/80"
        }`}
      >
        전체
      </button>
      {REGION_LIST.map((r) => (
        <button
          key={r.value}
          onClick={() => handleClick(r.value)}
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            selected === r.value
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
