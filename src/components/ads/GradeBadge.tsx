import { Badge } from "@/components/ui/badge";
import { getAdGrade } from "@/lib/utils/ad-grade";
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
 *
 * @param totalPaidAdDays - Total cumulative paid ad days
 * @param size - Badge size: "sm" for cards (default), "md" for detail pages
 * @param showDays - Whether to show "누적 OO일" text (default: false)
 */
export default function GradeBadge({
  totalPaidAdDays,
  size = "sm",
  showDays = false,
}: GradeBadgeProps) {
  const gradeInfo = getAdGrade(totalPaidAdDays);

  // Don't render anything for "none" grade
  if (gradeInfo.grade === "none") {
    return null;
  }

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium border-current/20 bg-current/10",
        gradeInfo.colorClass,
        sizeClasses[size]
      )}
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
  );
}
