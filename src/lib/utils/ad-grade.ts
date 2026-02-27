/**
 * Ad grade system based on cumulative paid ad days
 */

export interface AdGrade {
  grade: "none" | "bronze" | "silver" | "gold" | "diamond";
  label: string;
  icon: string;
  colorClass: string;
  totalDays: number;
}

/**
 * Calculate ad grade based on total paid ad days
 *
 * Grade thresholds:
 * - None: < 30 days
 * - Bronze: 30-89 days
 * - Silver: 90-179 days
 * - Gold: 180-359 days
 * - Diamond: 360+ days
 *
 * @param totalPaidAdDays - Total cumulative paid ad days
 * @returns AdGrade object with grade, label, icon, color class, and total days
 */
export function getAdGrade(totalPaidAdDays: number): AdGrade {
  const days = Math.max(0, totalPaidAdDays); // Ensure non-negative

  if (days < 30) {
    return {
      grade: "none",
      label: "",
      icon: "",
      colorClass: "",
      totalDays: days,
    };
  }

  if (days < 90) {
    return {
      grade: "bronze",
      label: "브론즈",
      icon: "🥉",
      colorClass: "text-[#CD7F32]",
      totalDays: days,
    };
  }

  if (days < 180) {
    return {
      grade: "silver",
      label: "실버",
      icon: "🥈",
      colorClass: "text-[#C0C0C0]",
      totalDays: days,
    };
  }

  if (days < 360) {
    return {
      grade: "gold",
      label: "골드",
      icon: "🥇",
      colorClass: "text-[#D4A853]",
      totalDays: days,
    };
  }

  return {
    grade: "diamond",
    label: "다이아",
    icon: "💎",
    colorClass: "text-[#60A5FA]",
    totalDays: days,
  };
}
