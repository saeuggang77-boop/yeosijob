"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Type } from "lucide-react";

const FONT_SIZE_KEY = "yeosialba-font-size";
const FONT_SIZES = {
  normal: "16",
  large: "18",
} as const;

type FontSize = keyof typeof FONT_SIZES;

export function FontSizeToggle() {
  const [fontSize, setFontSize] = useState<FontSize>("normal");

  useEffect(() => {
    // Read current font size from localStorage
    const savedFontSize = localStorage.getItem(FONT_SIZE_KEY) || FONT_SIZES.normal;
    setFontSize(savedFontSize === FONT_SIZES.large ? "large" : "normal");
  }, []);

  const handleFontSizeChange = (size: FontSize) => {
    const fontSizeValue = FONT_SIZES[size];
    setFontSize(size);
    localStorage.setItem(FONT_SIZE_KEY, fontSizeValue);
    // Use data attribute for text-only scaling (no layout breakage)
    if (size === "large") {
      document.documentElement.setAttribute("data-font-size", "large");
    } else {
      document.documentElement.removeAttribute("data-font-size");
    }
    // Clean up old approach
    document.documentElement.style.fontSize = "";
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Type className="size-5 text-muted-foreground" />
            <span className="font-medium">글자 크기</span>
          </div>
          <div className="flex rounded-lg bg-muted p-0.5">
            <button
              type="button"
              onClick={() => handleFontSizeChange("normal")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                fontSize === "normal"
                  ? "bg-primary text-primary-foreground"
                  : "bg-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              보통
            </button>
            <button
              type="button"
              onClick={() => handleFontSizeChange("large")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                fontSize === "large"
                  ? "bg-primary text-primary-foreground"
                  : "bg-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              크게
            </button>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          설정은 이 기기에 저장됩니다
        </p>
      </CardContent>
    </Card>
  );
}
