"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { Region, BusinessType } from "@/generated/prisma/client";
import { REGIONS } from "@/lib/constants/regions";

interface BannerAd {
  id: string;
  title: string;
  businessName: string;
  businessType: BusinessType;
  regions: Region[];
  salaryText: string;
}

interface Props {
  ads: BannerAd[];
}

export function BannerSlider({ ads }: Props) {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % ads.length);
  }, [ads.length]);

  useEffect(() => {
    if (ads.length <= 1) return;
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [ads.length, next]);

  if (ads.length === 0) return null;

  return (
    <section className="border-b bg-gradient-to-r from-card via-primary/5 to-card">
      <div className="relative overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {ads.map((ad) => (
            <Link
              key={ad.id}
              href={`/jobs/${ad.id}`}
              className="w-full shrink-0 px-6 py-6"
            >
              <div className="mx-auto max-w-screen-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-primary">특수배너</p>
                    <h3 className="mt-0.5 text-base font-bold">{ad.title}</h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {ad.businessName} · {ad.regions.map(r => REGIONS[r]?.shortLabel || r).join(", ")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-success">{ad.salaryText}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
        {/* Dots indicator */}
        {ads.length > 1 && (
          <div className="flex justify-center gap-1.5 pb-3">
            {ads.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === current ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
