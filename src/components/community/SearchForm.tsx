"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SearchForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentQuery = searchParams.get("q") || "";
  const currentCategory = searchParams.get("category") || "";

  const [query, setQuery] = useState(currentQuery);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const params = new URLSearchParams();
    if (query.trim()) {
      params.set("q", query.trim());
    }
    if (currentCategory) {
      params.set("category", currentCategory);
    }
    // 검색 시 페이지는 1로 리셋

    startTransition(() => {
      router.push(`/community${params.toString() ? `?${params.toString()}` : ""}`);
    });
  };

  const handleClear = () => {
    setQuery("");

    const params = new URLSearchParams();
    if (currentCategory) {
      params.set("category", currentCategory);
    }

    startTransition(() => {
      router.push(`/community${params.toString() ? `?${params.toString()}` : ""}`);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="제목 + 본문 검색..."
            className="h-10 w-full rounded-md border border-input bg-background px-3 pr-9 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isPending}
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              disabled={isPending}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button type="submit" size="sm" disabled={isPending}>
          <Search className="mr-1.5 h-4 w-4" />
          검색
        </Button>
      </div>
    </form>
  );
}
