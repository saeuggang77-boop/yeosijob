"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/jobs", label: "채용정보", icon: "🏠" },
  { href: "/business/dashboard", label: "광고 관리", icon: "📋" },
  { href: "/business/ads/new", label: "광고 등록", icon: "➕" },
  { href: "/business/resumes", label: "인재 정보", icon: "👥" },
];

interface BusinessSidebarProps {
  userName: string;
}

export function BusinessSidebar({ userName }: BusinessSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/jobs") return pathname === "/jobs";
    if (href === "/business/dashboard") return pathname === "/business/dashboard";
    if (href === "/business/ads/new") return pathname === "/business/ads/new";
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-md border bg-background shadow-sm md:hidden"
        aria-label="메뉴 열기"
      >
        {mobileOpen ? (
          <span className="text-lg">✕</span>
        ) : (
          <span className="text-lg">☰</span>
        )}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 flex h-full w-60 flex-col border-r bg-background transition-transform md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-14 items-center border-b px-4">
          <Link href="/" className="text-lg font-bold text-primary">
            여시알바
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t px-4 py-3">
          <p className="truncate text-sm font-medium">{userName}님</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-1 w-full justify-start px-0 text-xs text-muted-foreground"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            로그아웃
          </Button>
        </div>
      </aside>
    </>
  );
}
