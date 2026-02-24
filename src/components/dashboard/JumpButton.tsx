"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  adId: string;
  manualJumpPerDay: number;
  manualJumpUsedToday: number;
  lastManualJumpAt: string | null;
}

export function JumpButton({ adId, manualJumpPerDay, manualJumpUsedToday, lastManualJumpAt }: Props) {
  const [remaining, setRemaining] = useState(manualJumpPerDay - manualJumpUsedToday);
  const [loading, setLoading] = useState(false);
  const [cooldownEnd, setCooldownEnd] = useState<Date | null>(null);
  const [cooldownText, setCooldownText] = useState("");

  // Initialize cooldown from server data
  useEffect(() => {
    if (lastManualJumpAt) {
      const end = new Date(new Date(lastManualJumpAt).getTime() + 30 * 60 * 1000);
      if (end > new Date()) {
        setCooldownEnd(end);
      }
    }
  }, [lastManualJumpAt]);

  // Cooldown timer
  useEffect(() => {
    if (!cooldownEnd) {
      setCooldownText("");
      return;
    }

    function tick() {
      const diff = cooldownEnd!.getTime() - Date.now();
      if (diff <= 0) {
        setCooldownEnd(null);
        setCooldownText("");
        return;
      }
      const min = Math.floor(diff / 60000);
      const sec = Math.floor((diff % 60000) / 1000);
      setCooldownText(`${min}:${sec.toString().padStart(2, "0")}`);
    }

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [cooldownEnd]);

  if (manualJumpPerDay === 0) return null;

  async function handleJump(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    setLoading(true);
    try {
      const res = await fetch(`/api/ads/${adId}/jump`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error);
        if (data.nextAvailable) {
          setCooldownEnd(new Date(data.nextAvailable));
        }
        return;
      }
      setRemaining(data.remaining);
      setCooldownEnd(new Date(data.nextAvailable));
    } catch {
      alert("점프 실패");
    } finally {
      setLoading(false);
    }
  }

  const isDisabled = loading || remaining <= 0 || !!cooldownEnd;

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={isDisabled}
        onClick={handleJump}
        className="shrink-0"
        aria-label="광고 수동점프"
      >
        {loading ? "점프 중..." : cooldownEnd ? cooldownText : "수동점프"}
      </Button>
      <span className="text-xs text-muted-foreground">
        {remaining}/{manualJumpPerDay}회 남음
      </span>
    </div>
  );
}
