"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Smartphone, Share, Plus } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallButton() {
  const [isInstalled, setIsInstalled] = useState(true); // default hidden until check
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    // Already installed as PWA → hide
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone ||
      document.referrer.includes("android-app://");

    if (standalone) {
      setIsInstalled(true);
      return;
    }

    setIsInstalled(false);

    const iosDevice = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    setIsIOS(iosDevice);

    if (!iosDevice) {
      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
      };
      window.addEventListener("beforeinstallprompt", handler);
      return () => window.removeEventListener("beforeinstallprompt", handler);
    }
  }, []);

  // PWA 이미 설치됨 → 버튼 숨김
  if (isInstalled) return null;

  const handleClick = async () => {
    if (deferredPrompt) {
      // Android: native install prompt
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
        setIsInstalled(true);
      }
    } else {
      // iOS or fallback: show guide modal
      setShowGuide(true);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="relative rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="홈 화면에 추가"
        title="홈 화면에 추가"
      >
        <Smartphone className="size-5" />
        {/* 작은 점으로 주목 유도 */}
        <span className="absolute right-1 top-1 size-2 rounded-full bg-primary" />
      </button>

      {/* 설치 가이드 모달 - Portal로 body에 렌더링 (헤더 backdrop-blur 스태킹 컨텍스트 회피) */}
      {showGuide && createPortal(
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowGuide(false)}
        >
          <div
            className="w-full max-w-md animate-in slide-in-from-bottom duration-300 rounded-t-2xl bg-card px-5 pb-8 pt-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 핸들 */}
            <div className="mx-auto mb-5 h-1 w-9 rounded-full bg-muted-foreground/30" />

            <h3 className="mb-3 text-center text-lg font-bold">
              홈 화면에 추가하기
            </h3>

            {/* 혜택 안내 - 설치 단계 위에 배치 */}
            <div className="mb-5 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-center text-sm font-medium leading-relaxed text-primary">
              여시잡을 홈화면에 추가하면 댓글·쪽지·좋아요 알림을 바로 받을 수 있어요!
            </div>

            {isIOS ? (
              // iOS Safari 가이드
              <div className="flex flex-col gap-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    1
                  </div>
                  <div>
                    <p className="font-semibold">하단 공유 버튼 누르기</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Safari 하단 바에서 공유 아이콘을 눌러주세요
                    </p>
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 text-sm text-primary">
                      <Share className="h-4 w-4" />
                      <span>공유</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    2
                  </div>
                  <div>
                    <p className="font-semibold">
                      &quot;홈 화면에 추가&quot; 선택
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      메뉴를 스크롤해서 찾아 눌러주세요
                    </p>
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 text-sm text-primary">
                      <Plus className="h-4 w-4" />
                      <span>홈 화면에 추가</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    3
                  </div>
                  <div>
                    <p className="font-semibold">
                      오른쪽 상단 &quot;추가&quot; 누르기
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      여시잡 아이콘이 홈 화면에 추가됩니다!
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              // Chrome/기타 브라우저 가이드
              <div className="flex flex-col gap-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    1
                  </div>
                  <div>
                    <p className="font-semibold">
                      브라우저 메뉴 열기
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Chrome 우측 상단 점 3개(&#8942;) 메뉴를 누르세요
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    2
                  </div>
                  <div>
                    <p className="font-semibold">
                      &quot;홈 화면에 추가&quot; 또는 &quot;앱 설치&quot; 선택
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      메뉴에서 해당 항목을 찾아 눌러주세요
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 하단 */}
            <div className="mt-6 border-t pt-4 text-center">
              <button
                onClick={() => setShowGuide(false)}
                className="w-full rounded-xl bg-muted py-3 text-sm font-medium transition-colors hover:bg-muted/80"
              >
                닫기
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
