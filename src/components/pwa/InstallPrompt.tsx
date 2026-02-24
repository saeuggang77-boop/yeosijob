"use client";

import { useEffect, useState } from "react";
import { X, Download, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    const isInStandalone = window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes("android-app://");

    setIsStandalone(isInStandalone);

    if (isInStandalone) {
      return; // Don't show prompt if already installed
    }

    // Check if dismissed recently
    const dismissedAt = localStorage.getItem("pwa-install-dismissed");
    if (dismissedAt) {
      const dismissedDate = new Date(dismissedAt);
      const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        return; // Don't show for 7 days after dismissal
      }
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // Android Chrome: beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // iOS: Show prompt after a delay (no beforeinstallprompt on iOS)
    if (isIOSDevice) {
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-install-dismissed", new Date().toISOString());
  };

  if (!showPrompt || isStandalone) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-0 right-0 z-50 animate-slide-up md:bottom-0">
      <div className="mx-auto max-w-2xl px-4 pb-4">
        <div className="relative overflow-hidden rounded-xl border border-gold-500/20 bg-gradient-to-br from-dark-800 via-dark-900 to-black p-4 shadow-2xl backdrop-blur-sm">
          {/* Decorative gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-gold-500/5 to-transparent pointer-events-none" />

          <div className="relative flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gold-500 to-gold-600">
                <Download className="h-6 w-6 text-black" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-white mb-1">
                홈 화면에 여시잡 추가
              </h3>

              {isIOS ? (
                <div className="space-y-2">
                  <p className="text-sm text-gray-300">
                    빠른 접속을 위해 홈 화면에 추가하세요
                  </p>
                  <div className="flex items-center gap-2 rounded-lg bg-dark-700/50 p-3 text-xs text-gray-300">
                    <Share className="h-4 w-4 flex-shrink-0 text-gold-500" />
                    <span>
                      하단 <strong className="text-white">공유 버튼</strong>을 누른 후{" "}
                      <strong className="text-white">"홈 화면에 추가"</strong>를 선택하세요
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-300">
                    앱처럼 빠르게 접속하고 알림도 받으세요
                  </p>
                  <button
                    onClick={handleInstallClick}
                    className="w-full rounded-lg bg-gradient-to-r from-gold-500 to-gold-600 px-4 py-2.5 text-sm font-semibold text-black transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    지금 설치하기
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={handleDismiss}
              className="flex-shrink-0 rounded-lg p-1 text-gray-400 transition-colors hover:bg-dark-700 hover:text-white"
              aria-label="닫기"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
