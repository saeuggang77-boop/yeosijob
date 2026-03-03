"use client";

import { useState, useEffect } from "react";

interface EventBannerProps {
  eventInfo: { eventName: string; endDate: string | null; bonus30: number; bonus60: number; bonus90: number };
}

export function EventBanner({ eventInfo }: EventBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("event-bar-dismissed");
    if (dismissed) {
      const days = (Date.now() - new Date(dismissed).getTime()) / (1000 * 60 * 60 * 24);
      if (days < 7) return;
    }
    setVisible(true);
  }, []);

  if (!visible) return null;

  const dDay = eventInfo.endDate
    ? Math.ceil((new Date(eventInfo.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="relative bg-gradient-to-r from-primary/90 to-amber-600/90 px-4 py-2 text-center text-sm font-medium text-primary-foreground">
      <span>
        🎉 {eventInfo.eventName} 진행 중! 60일 등록하면 {60 + eventInfo.bonus60}일!
        {dDay !== null && dDay > 0 && ` 종료까지 D-${dDay}`}
      </span>
      <button
        onClick={() => {
          setVisible(false);
          localStorage.setItem("event-bar-dismissed", new Date().toISOString());
        }}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 hover:bg-black/10"
        aria-label="닫기"
      >
        ✕
      </button>
    </div>
  );
}
