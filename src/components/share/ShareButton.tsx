"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Link2, Check, MessageCircle } from "lucide-react";
import { toast } from "sonner";

interface ShareButtonProps {
  title: string;
  description?: string;
}

const KAKAO_JS_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY || "";

interface KakaoSDK {
  init: (key: string) => void;
  isInitialized: () => boolean;
  Share?: {
    sendDefault: (options: Record<string, unknown>) => void;
  };
}

interface WindowWithKakao extends Window {
  Kakao?: KakaoSDK;
}

function loadKakaoSdk(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject();
    const win = window as WindowWithKakao;
    if (win.Kakao) {
      const Kakao = win.Kakao;
      if (!Kakao.isInitialized() && KAKAO_JS_KEY) Kakao.init(KAKAO_JS_KEY);
      return resolve();
    }
    const script = document.createElement("script");
    script.src = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js";
    script.onload = () => {
      const Kakao = (window as WindowWithKakao).Kakao;
      if (Kakao && !Kakao.isInitialized() && KAKAO_JS_KEY) Kakao.init(KAKAO_JS_KEY);
      resolve();
    };
    script.onerror = () => reject();
    document.head.appendChild(script);
  });
}

export function ShareButton({ title, description }: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [kakaoReady, setKakaoReady] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const getUrl = useCallback(() => typeof window !== "undefined" ? window.location.href : "", []);

  // Preload Kakao SDK if key exists
  useEffect(() => {
    if (!KAKAO_JS_KEY) return;
    loadKakaoSdk().then(() => setKakaoReady(true)).catch(() => {});
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  async function handleShare() {
    // 모바일에서만 네이티브 공유 시트 사용 (데스크톱은 커스텀 드롭다운)
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile && navigator.share) {
      try {
        await navigator.share({
          title,
          text: description || title,
          url: getUrl(),
        });
        return;
      } catch {
        // User cancelled - fall through to dropdown
      }
    }
    setOpen((prev) => !prev);
  }

  async function handleCopyUrl() {
    try {
      await navigator.clipboard.writeText(getUrl());
      setCopied(true);
      toast.success("링크가 복사되었습니다");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("복사에 실패했습니다");
    }
    setOpen(false);
  }

  function handleKakao() {
    const Kakao = (window as WindowWithKakao).Kakao;
    if (!Kakao?.Share) return;
    Kakao.Share.sendDefault({
      objectType: "feed",
      content: {
        title,
        description: description || "여시잡에서 채용정보를 확인하세요",
        imageUrl: "https://yeosijob.com/og-image.png",
        link: { mobileWebUrl: getUrl(), webUrl: getUrl() },
      },
      buttons: [
        { title: "채용정보 보기", link: { mobileWebUrl: getUrl(), webUrl: getUrl() } },
      ],
    });
    setOpen(false);
  }

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleShare}
        className="h-9 w-9 shrink-0"
        aria-label="공유하기"
      >
        <Share2 className="h-5 w-5" />
      </Button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-40 rounded-lg border bg-popover p-1 shadow-lg animate-in fade-in-0 zoom-in-95">
          <button
            onClick={handleCopyUrl}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-muted"
            aria-label="URL 복사"
          >
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Link2 className="h-4 w-4" />}
            URL 복사
          </button>
          {kakaoReady && (
            <button
              onClick={handleKakao}
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-muted"
              aria-label="카카오톡으로 공유"
            >
              <MessageCircle className="h-4 w-4 text-yellow-500" />
              카카오톡
            </button>
          )}
        </div>
      )}
    </div>
  );
}
