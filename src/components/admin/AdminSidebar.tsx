"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/admin", label: "대시보드", icon: "📊" },
  { href: "/admin/ads", label: "광고 관리", icon: "📢" },
  { href: "/admin/payments", label: "결제 관리", icon: "💳" },
  { href: "/admin/users", label: "회원 관리", icon: "👥" },
  { href: "/admin/resumes", label: "이력서", icon: "📄" },
  { href: "/admin/reviews", label: "후기 관리", icon: "⭐" },
  { href: "/admin/verification", label: "업소 인증", icon: "✅" },
  { href: "/admin/cafe-sync", label: "카페 연동", icon: "🔗" },
  { href: "/admin/settings", label: "설정", icon: "⚙️" },
];

interface AdminSidebarProps {
  userName: string;
}

export function AdminSidebar({ userName }: AdminSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
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
          <Link href="/admin" className="text-lg font-bold text-primary">
            여시알바 관리자
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
          <p className="truncate text-sm font-medium">{userName}</p>
          <Link href="/">
            <Button variant="ghost" size="sm" className="mt-1 w-full justify-start px-0 text-xs text-muted-foreground">
              ← 사이트로 돌아가기
            </Button>
          </Link>
        </div>
      </aside>
    </>
  );
}
