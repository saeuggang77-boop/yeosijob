"use client";

import { useState, useEffect } from "react";
import { Smartphone, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function AnnouncementBar() {
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<"promo" | "install-android" | "install-ios" | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Already installed → show nothing
    const standalone = window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone ||
      document.referrer.includes("android-app://");

    if (standalone) return;

    const dismissed = localStorage.getItem("pwa-bar-dismissed");
    if (dismissed) {
      const days = (Date.now() - new Date(dismissed).getTime()) / (1000 * 60 * 60 * 24);
      if (days < 7) {
        // PWA bar dismissed recently → show promo instead
        const promoDismissed = localStorage.getItem("announcement-dismissed");
        if (!promoDismissed) {
          setMode("promo");
          setVisible(true);
        }
        return;
      }
    }

    const isIOSDevice = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());

    if (isIOSDevice) {
      setMode("install-ios");
      setVisible(true);
      return;
    }

    // Android: wait for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setMode("install-android");
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Fallback: if no beforeinstallprompt after 2s, show promo
    const timeout = setTimeout(() => {
      if (!deferredPrompt) {
        const promoDismissed = localStorage.getItem("announcement-dismissed");
        if (!promoDismissed) {
          setMode("promo");
          setVisible(true);
        }
      }
    }, 2000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setVisible(false);
    }
  };

  const dismiss = () => {
    setVisible(false);
    if (mode === "promo") {
      localStorage.setItem("announcement-dismissed", "1");
    } else {
      localStorage.setItem("pwa-bar-dismissed", new Date().toISOString());
    }
  };

  if (!visible || !mode) return null;

  // Promo banner
  if (mode === "promo") {
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

  // PWA install banner
  return (
    <div className="relative bg-gradient-to-r from-primary to-accent px-4 py-2 text-sm font-medium text-primary-foreground">
      <div className="mx-auto flex max-w-screen-xl items-center justify-center gap-2">
        <Smartphone className="h-4 w-4 shrink-0" />
        {mode === "install-android" ? (
          <>
            <span>여시잡 앱을 설치하면 더 빠르게!</span>
            <button
              onClick={handleInstall}
              className="rounded-full bg-white/20 px-3 py-0.5 text-xs font-bold transition-colors hover:bg-white/30"
            >
              설치
            </button>
          </>
        ) : (
          <>
            <span className="flex items-center gap-1">
              <Share className="inline h-3.5 w-3.5" />
              공유 버튼 → &quot;홈 화면에 추가&quot;로 앱 설치!
            </span>
          </>
        )}
      </div>
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
