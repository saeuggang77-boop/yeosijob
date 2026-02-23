"use client";

import { useRouter } from "next/navigation";
import { useRef, useCallback } from "react";

interface DebouncedSearchProps {
  defaultValue?: string;
  baseUrl: string;
  additionalParams?: Record<string, string>;
  placeholder?: string;
}

export function DebouncedSearch({
  defaultValue,
  baseUrl,
  additionalParams = {},
  placeholder = "업소명, 제목 검색",
}: DebouncedSearchProps) {
  const router = useRouter();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;

      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(() => {
        const params = new URLSearchParams(additionalParams);
        if (value.trim()) {
          params.set("search", value.trim());
        } else {
          params.delete("search");
        }
        params.delete("page");
        router.push(`${baseUrl}?${params.toString()}`);
      }, 300);
    },
    [router, baseUrl, additionalParams]
  );

  return (
    <input
      type="text"
      defaultValue={defaultValue}
      onChange={handleChange}
      placeholder={placeholder}
      className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
    />
  );
}
