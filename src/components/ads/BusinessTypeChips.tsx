"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { BUSINESS_TYPE_LIST } from "@/lib/constants/business-types";

export function BusinessTypeChips({ current }: { current?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleClick(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "ALL") {
      params.delete("businessType");
    } else {
      params.set("businessType", value);
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
      {BUSINESS_TYPE_LIST.map((b) => (
        <button
          key={b.value}
          onClick={() => handleClick(b.value)}
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            selected === b.value
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          {b.label}
        </button>
      ))}
    </div>
  );
}
