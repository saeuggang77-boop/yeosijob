"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

interface SidebarProps {
  navItems: NavItem[];
  userName: string;
  logoText?: string;
  logoHref?: string;
  exactMatchPaths?: string[];
  showLogout?: boolean;
  showBackLink?: boolean;
  backLinkLabel?: string;
  userNameSuffix?: string;
}

export function Sidebar({
  navItems,
  userName,
  logoText = "여시알바",
  logoHref = "/",
  exactMatchPaths = [],
  showLogout = true,
  showBackLink = false,
  backLinkLabel = "← 사이트로 이동",
  userNameSuffix = "님",
}: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string) {
    if (exactMatchPaths.includes(href)) return pathname === href;
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
        className={`fixed left-0 top-0 z-40 flex h-full w-60 flex-col border-r border-border bg-sidebar transition-transform md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-14 items-center border-b border-border px-4">
          <Link href={logoHref} className="text-lg font-bold text-primary">
            {logoText}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
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
        <div className="border-t border-border px-4 py-3">
          <p className="truncate text-sm font-medium">
            {userName}{userNameSuffix}
          </p>
          {showBackLink && (
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 w-full justify-start px-0 text-xs text-muted-foreground"
              >
                {backLinkLabel}
              </Button>
            </Link>
          )}
          {showLogout && (
            <Button
              variant="ghost"
              size="sm"
              className={`w-full justify-start px-0 text-xs text-muted-foreground ${!showBackLink ? "mt-1" : ""}`}
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              로그아웃
            </Button>
          )}
        </div>
      </aside>
    </>
  );
}
