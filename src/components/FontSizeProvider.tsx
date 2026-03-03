"use client";

import { useLayoutEffect } from "react";

const FONT_SIZE_KEY = "yeosialba-font-size";

export function FontSizeProvider({ children }: { children: React.ReactNode }) {
  useLayoutEffect(() => {
    // Read from localStorage and apply as data attribute (text-only scaling)
    const savedFontSize = localStorage.getItem(FONT_SIZE_KEY) || "16";
    if (savedFontSize === "18") {
      document.documentElement.setAttribute("data-font-size", "large");
    } else {
      document.documentElement.removeAttribute("data-font-size");
    }
    // Clean up old approach: reset root font-size if it was set
    document.documentElement.style.fontSize = "";
  }, []);

  return <>{children}</>;
}
