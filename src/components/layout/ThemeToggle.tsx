"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-muted"
        aria-label="테마 전환"
      >
        <Moon className="h-6 w-6" />
      </button>
    );
  }

  return (
    <button
      className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-primary/20"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="테마 전환"
    >
      {theme === "dark" ? (
        <Sun className="h-6 w-6 text-primary" />
      ) : (
        <Moon className="h-6 w-6 text-foreground" />
      )}
    </button>
  );
}
