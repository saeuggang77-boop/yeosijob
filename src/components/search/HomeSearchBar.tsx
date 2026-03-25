"use client";

import { useState } from "react";
import { DISTRICTS } from "@/lib/constants/districts";

interface HomeSearchBarProps {
  regions: Record<string, { label: string }>;
  businessTypes: Record<string, { label: string }>;
}

export function HomeSearchBar({ regions, businessTypes }: HomeSearchBarProps) {
  const [selectedRegion, setSelectedRegion] = useState("");

  const districtOptions = selectedRegion && DISTRICTS[selectedRegion as keyof typeof DISTRICTS]
    ? DISTRICTS[selectedRegion as keyof typeof DISTRICTS]
    : [];

  return (
    <form
      action="/jobs"
      method="get"
      className="hero-search mx-auto mt-8 flex max-w-3xl flex-col overflow-hidden bg-card sm:flex-row"
    >
      <div className="flex border-b border-border/50 sm:contents">
        <select
          name="region"
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          className="h-9 flex-1 border-r border-border/50 bg-transparent px-3 text-xs text-foreground sm:h-12 sm:flex-none sm:border-b-0 sm:px-4 sm:text-sm"
        >
          <option value="">지역 전체</option>
          {Object.entries(regions).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>
        {districtOptions.length > 0 && (
          <select
            name="district"
            defaultValue=""
            className="h-9 flex-1 border-r border-border/50 bg-transparent px-3 text-xs text-foreground sm:h-12 sm:flex-none sm:border-b-0 sm:px-4 sm:text-sm"
          >
            <option value="">세부지역 전체</option>
            {districtOptions.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        )}
        <select
          name="businessType"
          defaultValue=""
          className="h-9 flex-1 bg-transparent px-3 text-xs text-foreground sm:h-12 sm:flex-none sm:border-b-0 sm:border-r sm:border-border/50 sm:px-4 sm:text-sm"
        >
          <option value="">업종 전체</option>
          {Object.entries(businessTypes).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>
      </div>
      <div className="flex sm:contents">
        <input
          type="text"
          name="search"
          placeholder="업소명 / 제목 검색"
          className="h-[42px] min-w-0 flex-1 bg-transparent px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none sm:h-12 sm:border-r sm:border-border/50"
        />
        <button
          type="submit"
          className="h-[42px] shrink-0 rounded-br-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:h-12 sm:rounded-none sm:px-8"
        >
          검색
        </button>
      </div>
    </form>
  );
}
