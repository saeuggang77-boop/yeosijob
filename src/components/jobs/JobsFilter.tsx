"use client";

import { useState, useEffect } from "react";
import { SlidersHorizontal, X } from "lucide-react";

interface JobsFilterProps {
  regions: Record<string, { label: string }>;
  businessTypes: Record<string, { label: string }>;
  currentRegion?: string;
  currentBusinessType?: string;
  currentSearch?: string;
  currentSort?: string;
  currentProductId?: string;
}

export function JobsFilter({
  regions,
  businessTypes,
  currentRegion,
  currentBusinessType,
  currentSearch,
  currentSort = "jump",
  currentProductId,
}: JobsFilterProps) {
  const [open, setOpen] = useState(false);
  const [focusFilter, setFocusFilter] = useState<"region" | "businessType" | "sort" | null>(null);

  const regionLabel = currentRegion ? regions[currentRegion]?.label : "전체 지역";
  const bizLabel = currentBusinessType ? businessTypes[currentBusinessType]?.label : "전체 업종";
  const sortLabel = currentSort === "views" ? "조회순" : "기본순";

  // Auto-clear focus after 2 seconds
  useEffect(() => {
    if (focusFilter) {
      const timer = setTimeout(() => setFocusFilter(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [focusFilter]);

  return (
    <div className="sticky top-14 z-40 border-b bg-background">
      {/* 모바일: 컴팩트 바 */}
      <div className="flex items-center gap-2 px-4 py-2 md:hidden">
        <div className="flex flex-1 flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              if (!open) setOpen(true);
              setFocusFilter("region");
            }}
            className={`cursor-pointer rounded-full border px-2.5 py-1 text-xs transition-colors active:bg-muted ${currentRegion ? "border-primary text-primary" : "border-border text-muted-foreground"}`}
          >
            {regionLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              if (!open) setOpen(true);
              setFocusFilter("businessType");
            }}
            className={`cursor-pointer rounded-full border px-2.5 py-1 text-xs transition-colors active:bg-muted ${currentBusinessType ? "border-primary text-primary" : "border-border text-muted-foreground"}`}
          >
            {bizLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              if (!open) setOpen(true);
              setFocusFilter("sort");
            }}
            className="cursor-pointer rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors active:bg-muted"
          >
            {sortLabel}
          </button>
          {currentSearch && (
            <span className="rounded-full border border-primary bg-primary/10 px-2.5 py-1 text-xs text-primary">
              &quot;{currentSearch}&quot;
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            setOpen(!open);
            if (open) setFocusFilter(null);
          }}
          className="flex shrink-0 items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-muted"
        >
          {open ? <X className="size-3.5" /> : <SlidersHorizontal className="size-3.5" />}
          {open ? "접기" : "필터"}
        </button>
      </div>

      {/* 모바일: 펼쳐진 필터 */}
      {open && (
        <div className="border-t border-border px-4 pb-3 pt-2 md:hidden">
          <form action="/jobs" method="get" className="flex flex-col gap-2">
            <select
              name="region"
              defaultValue={currentRegion || ""}
              className={`h-10 rounded-md border bg-background px-3 text-sm ${focusFilter === "region" ? "ring-1 ring-primary border-primary" : ""}`}
            >
              <option value="">지역 전체</option>
              {Object.entries(regions).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
            <select
              name="businessType"
              defaultValue={currentBusinessType || ""}
              className={`h-10 rounded-md border bg-background px-3 text-sm ${focusFilter === "businessType" ? "ring-1 ring-primary border-primary" : ""}`}
            >
              <option value="">업종 전체</option>
              {Object.entries(businessTypes).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
            <input type="text" name="search" defaultValue={currentSearch} placeholder="업소명 / 제목 검색" className="h-10 rounded-md border bg-background px-3 text-sm placeholder:text-muted-foreground" />
            {currentProductId && <input type="hidden" name="productId" value={currentProductId} />}
            <div className="flex gap-2">
              <select
                name="sort"
                defaultValue={currentSort}
                className={`h-10 flex-1 rounded-md border bg-background px-3 text-sm ${focusFilter === "sort" ? "ring-1 ring-primary border-primary" : ""}`}
              >
                <option value="jump">기본순</option>
                <option value="views">조회순</option>
              </select>
              <button type="submit" className="h-10 flex-1 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                검색
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 데스크톱: 기존 필터 그대로 */}
      <div className="hidden px-4 py-3 md:block">
        <form action="/jobs" method="get" className="flex items-center gap-2">
          <select name="region" defaultValue={currentRegion || ""} className="h-10 rounded-md border bg-background px-3 text-sm">
            <option value="">지역 전체</option>
            {Object.entries(regions).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
          <select name="businessType" defaultValue={currentBusinessType || ""} className="h-10 rounded-md border bg-background px-3 text-sm">
            <option value="">업종 전체</option>
            {Object.entries(businessTypes).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
          {currentProductId && <input type="hidden" name="productId" value={currentProductId} />}
          <input type="text" name="search" defaultValue={currentSearch} placeholder="업소명 / 제목 검색" className="h-10 min-w-0 flex-1 rounded-md border bg-background px-3 text-sm placeholder:text-muted-foreground" />
          <select name="sort" defaultValue={currentSort} className="h-10 rounded-md border bg-background px-3 text-sm">
            <option value="jump">기본순</option>
            <option value="views">조회순</option>
          </select>
          <button type="submit" className="h-10 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            검색
          </button>
        </form>
      </div>
    </div>
  );
}
