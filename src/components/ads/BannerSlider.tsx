"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { Region, BusinessType } from "@/generated/prisma/client";
import { REGIONS } from "@/lib/constants/regions";
import { BUSINESS_TYPES } from "@/lib/constants/business-types";

interface BannerAd {
  id: string;
  title: string;
  businessName: string;
  businessType: BusinessType;
  regions: Region[];
  salaryText: string;
  viewCount: number;
  bannerColor?: number;
}

interface Props {
  ads: BannerAd[];
}

export function BannerSlider({ ads }: Props) {
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % ads.length);
  }, [ads.length]);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + ads.length) % ads.length);
  }, [ads.length]);

  useEffect(() => {
    if (ads.length <= 1 || isHovered) return;
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [ads.length, next, isHovered]);

  if (ads.length === 0) return null;

  return (
    <div
      className="relative overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {ads.map((ad) => {
          const regionLabels = ad.regions
            .map((r) => REGIONS[r]?.shortLabel || r)
            .join(", ");
          const biz = BUSINESS_TYPES[ad.businessType];

          return (
            <Link
              key={ad.id}
              href={`/jobs/${ad.id}`}
              className="group w-full shrink-0"
            >
              <div className="banner-card relative mx-4 my-4 flex min-h-[150px] items-center overflow-hidden rounded-xl px-6 py-5 transition-all duration-300 group-hover:scale-[1.01] group-hover:shadow-[0_0_40px_rgba(212,168,83,0.3)]">
                {/* Left side */}
                <div className="relative z-10 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="banner-badge rounded-md px-3 py-1 text-xs font-black tracking-wider">
                      노블레스
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {biz?.icon} {biz?.shortLabel}
                    </span>
                  </div>
                  <h3 className="mt-3 text-xl font-bold md:text-2xl">
                    {ad.businessName}
                  </h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {ad.title}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/70">
                    {regionLabels}
                  </p>
                </div>

                {/* Right side */}
                <div className="relative z-10 text-right">
                  <p className="text-2xl font-bold text-success md:text-3xl">
                    {ad.salaryText}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    조회 {ad.viewCount.toLocaleString()}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Navigation arrows */}
      {ads.length > 1 && (
        <>
          <button
            onClick={(e) => { e.preventDefault(); prev(); }}
            className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground shadow-md backdrop-blur-sm transition-all hover:bg-background hover:shadow-lg"
            aria-label="이전"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 12L6 8L10 4" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.preventDefault(); next(); }}
            className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground shadow-md backdrop-blur-sm transition-all hover:bg-background hover:shadow-lg"
            aria-label="다음"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 4L10 8L6 12" />
            </svg>
          </button>
        </>
      )}

      {/* Indicator dots */}
      {ads.length > 1 && (
        <div className="flex justify-center gap-1.5 pb-3">
          {ads.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2 rounded-full transition-all ${
                i === current
                  ? "w-6 bg-primary shadow-[0_0_8px_rgba(212,168,83,0.5)]"
                  : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
              aria-label={`${i + 1}번 광고로 이동`}
              aria-current={i === current ? "true" : "false"}
            />
          ))}
        </div>
      )}

      {/* Slide counter */}
      {ads.length > 1 && (
        <div className="absolute right-6 top-6 rounded-full bg-background/60 px-2.5 py-0.5 text-xs text-muted-foreground backdrop-blur-sm">
          {current + 1} / {ads.length}
        </div>
      )}
    </div>
  );
}
