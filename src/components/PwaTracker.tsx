"use client";

import { useEffect } from "react";

function getPlatform(): string {
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  return "desktop";
}

export function PwaTracker() {
  useEffect(() => {
    // standalone 모드가 아니면 추적 불필요
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone ||
      document.referrer.includes("android-app://");

    if (!isStandalone) return;

    // 1일 1회 제한 (localStorage)
    const today = new Date().toISOString().slice(0, 10);
    const lastTracked = localStorage.getItem("pwa_tracked_date");
    if (lastTracked === today) return;

    const platform = getPlatform();

    // fire-and-forget
    fetch("/api/pwa/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform }),
    })
      .then(() => {
        localStorage.setItem("pwa_tracked_date", today);
      })
      .catch(() => {});
  }, []);

  return null;
}
