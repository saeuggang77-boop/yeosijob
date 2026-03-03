"use client";

import { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { getAdGrade, GRADE_THRESHOLDS } from "@/lib/utils/ad-grade";
import { cn } from "@/lib/utils";

interface GradeBadgeProps {
  totalPaidAdDays: number;
  size?: "sm" | "md";
  showDays?: boolean;
}

/**
 * Display ad grade badge based on cumulative paid ad days
 *
 * Returns null for "none" grade (< 30 days)
 * Click to show grade info popover
 */
export default function GradeBadge({
  totalPaidAdDays,
  size = "sm",
  showDays = false,
}: GradeBadgeProps) {
  const gradeInfo = getAdGrade(totalPaidAdDays);
  const [showInfo, setShowInfo] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Don't render anything for "none" grade
  if (gradeInfo.grade === "none") {
    return null;
  }

  // Close on outside click
  useEffect(() => {
    if (!showInfo) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShowInfo(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showInfo]);

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
  };

  return (
    <div className="relative inline-block" ref={ref}>
      <Badge
        variant="outline"
        className={cn(
          "cursor-pointer font-medium border-current/20 bg-current/10",
          gradeInfo.colorClass,
          sizeClasses[size]
        )}
        onClick={() => setShowInfo(!showInfo)}
      >
        <span className="flex items-center gap-1">
          <span>{gradeInfo.icon}</span>
          <span>{gradeInfo.label}</span>
          {showDays && (
            <span className="text-[0.9em] opacity-80">
              누적 {gradeInfo.totalDays}일
            </span>
          )}
        </span>
      </Badge>

      {showInfo && (
        <div className="absolute left-0 top-full z-50 mt-2 w-56 rounded-lg border bg-background p-3 shadow-lg">
          <p className="mb-2 text-xs font-bold text-foreground">업소 등급 안내</p>
          <div className="space-y-1.5">
            {GRADE_THRESHOLDS.map((g) => (
              <div
                key={g.grade}
                className={cn(
                  "flex items-center justify-between rounded px-2 py-1 text-xs",
                  gradeInfo.grade === g.grade && "bg-muted"
                )}
              >
                <span className={cn("font-medium", g.colorClass)}>
                  {g.icon} {g.label}
                </span>
                <span className="text-muted-foreground">{g.condition}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">
            유료 광고 이용일수에 따라 등급이 올라갑니다
          </p>
        </div>
      )}
    </div>
  );
}
