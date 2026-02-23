"use client";

import { useState, useEffect } from "react";

export function AnnouncementBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("announcement-dismissed");
    if (!dismissed) setVisible(true);
  }, []);

  function dismiss() {
    setVisible(false);
    localStorage.setItem("announcement-dismissed", "1");
  }

  if (!visible) return null;

  return (
    <div className="relative bg-gradient-to-r from-primary to-accent px-4 py-2 text-center text-sm font-medium text-primary-foreground">
      <span>여시잡 오픈! 첫 광고 등록 시 50% 할인</span>
      <button
        onClick={dismiss}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 hover:bg-black/10"
        aria-label="닫기"
      >
        ✕
      </button>
    </div>
  );
}
