"use client";

import { useState, useEffect } from "react";
import { Smartphone, Share, X, Plus } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function AnnouncementBar() {
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<"promo" | "install-android" | "install-ios" | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showGuide, setShowGuide] = useState(false);

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
        <span>여시잡에서 유흥업소 채용정보와 인재를 만나보세요!</span>
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
    <>
      <div className="relative bg-gradient-to-r from-primary to-accent px-4 py-2 text-sm font-medium text-primary-foreground">
        <div className="mx-auto flex max-w-screen-xl items-center justify-center gap-2">
          <Smartphone className="h-4 w-4 shrink-0" />
          {mode === "install-android" ? (
            <>
              <span>홈 화면에 추가하면 댓글 알림을 바로 받아요!</span>
              <button
                onClick={handleInstall}
                className="rounded-full bg-white/20 px-3 py-0.5 text-xs font-bold transition-colors hover:bg-white/30"
              >
                설치
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowGuide(true)}
              className="flex items-center gap-1"
            >
              <span>홈 화면에 추가하면 댓글 알림을 바로 받아요!</span>
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold">방법 보기</span>
            </button>
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

      {/* iOS 설치 가이드 바텀시트 */}
      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowGuide(false)}
        >
          <div
            className="w-full max-w-md animate-in slide-in-from-bottom duration-300 rounded-t-2xl bg-card px-5 pb-8 pt-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 핸들 */}
            <div className="mx-auto mb-5 h-1 w-9 rounded-full bg-muted-foreground/30" />

            <h3 className="mb-6 text-center text-lg font-bold">홈 화면에 추가하기</h3>

            <div className="flex flex-col gap-5">
              {/* Step 1 */}
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">1</div>
                <div>
                  <p className="font-semibold">하단 공유 버튼 누르기</p>
                  <p className="mt-1 text-sm text-muted-foreground">Safari 하단 바에서 공유 아이콘을 눌러주세요</p>
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 text-sm text-primary">
                    <Share className="h-4 w-4" />
                    <span>공유</span>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">2</div>
                <div>
                  <p className="font-semibold">&quot;홈 화면에 추가&quot; 선택</p>
                  <p className="mt-1 text-sm text-muted-foreground">메뉴를 스크롤해서 찾아 눌러주세요</p>
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 text-sm text-primary">
                    <Plus className="h-4 w-4" />
                    <span>홈 화면에 추가</span>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">3</div>
                <div>
                  <p className="font-semibold">오른쪽 상단 &quot;추가&quot; 누르기</p>
                  <p className="mt-1 text-sm text-muted-foreground">여시잡 아이콘이 홈 화면에 추가됩니다!</p>
                </div>
              </div>
            </div>

            {/* 하단 */}
            <div className="mt-6 border-t pt-4 text-center">
              <p className="text-sm font-medium text-primary">앱처럼 바로 접속 + 댓글/쪽지/공지 알림 수신!</p>
              <button
                onClick={() => setShowGuide(false)}
                className="mt-4 w-full rounded-xl bg-muted py-3 text-sm font-medium transition-colors hover:bg-muted/80"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
