"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "telegram_banner_dismissed_v1";

export function TelegramPromoBanner() {
  // 초기값 true로 설정하여 hydration 시 깜빡임 방지
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== "1") {
      setHidden(false);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setHidden(true);
  };

  if (hidden) return null;

  return (
    <div className="relative mt-4 overflow-hidden rounded-lg border border-cyan-500/40 bg-gradient-to-r from-cyan-500/10 via-sky-500/10 to-blue-500/10 p-4 shadow-sm">
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="배너 닫기"
      >
        <span className="text-lg leading-none">×</span>
      </button>

      <div className="flex items-start gap-3 pr-8">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-2xl">
          📢
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-semibold text-foreground">
              새 이력서를 실시간으로 받아보세요
            </p>
            <span className="rounded-full bg-cyan-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              NEW
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            여시잡 공식 텔레그램 채널에서 신규 이력서가 등록되는 즉시 알림을 받을 수 있습니다. 경쟁 업소보다 한발 먼저 연락하세요.
          </p>
          <Link
            href="/business/notifications/telegram"
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-cyan-600 hover:text-cyan-700 hover:underline"
          >
            자세히 보기 <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
