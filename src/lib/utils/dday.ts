/**
 * Calculate D-day from a given date
 * @param targetDate - The target date to calculate D-day from
 * @returns D-day string (e.g., "D-7", "D-DAY", "마감") or null if expired
 */
export function calculateDday(targetDate: Date | string | null | undefined): {
  text: string;
  daysLeft: number;
  color: "red" | "orange" | "gray";
} | null {
  if (!targetDate) return null;

  const now = new Date();
  const target = new Date(targetDate);

  // Set both to start of day for accurate day calculation
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - now.getTime();
  const daysLeft = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Already expired
  if (daysLeft < 0) {
    return null;
  }

  // D-DAY
  if (daysLeft === 0) {
    return { text: "D-DAY", daysLeft: 0, color: "red" };
  }

  // D-N
  let color: "red" | "orange" | "gray";
  if (daysLeft <= 3) {
    color = "red";
  } else if (daysLeft <= 7) {
    color = "orange";
  } else {
    color = "gray";
  }

  return { text: `D-${daysLeft}`, daysLeft, color };
}

/**
 * Get badge color class for D-day display
 */
export function getDdayColorClass(color: "red" | "orange" | "gray"): string {
  switch (color) {
    case "red":
      return "bg-destructive text-destructive-foreground";
    case "orange":
      return "bg-orange-500 text-white";
    case "gray":
    default:
      return "bg-muted text-muted-foreground";
  }
}
