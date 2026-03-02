"use client";

import { useLayoutEffect } from "react";

const FONT_SIZE_KEY = "yeosialba-font-size";
const DEFAULT_FONT_SIZE = "16";

export function FontSizeProvider({ children }: { children: React.ReactNode }) {
  useLayoutEffect(() => {
    // Read from localStorage and apply immediately to prevent flicker
    const savedFontSize = localStorage.getItem(FONT_SIZE_KEY) || DEFAULT_FONT_SIZE;
    document.documentElement.style.fontSize = `${savedFontSize}px`;
  }, []);

  return <>{children}</>;
}
