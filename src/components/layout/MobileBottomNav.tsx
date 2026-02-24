"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
    </svg>
  );
}

function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

function BookmarkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);

  const role = session?.user.role;

  useEffect(() => {
    if (!session) return;

    const fetchUnreadCount = async () => {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unreadCount);
        }
      } catch (error) {
        console.error("Failed to fetch unread count:", error);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, [session]);

  let navItems;

  if (role === "ADMIN") {
    // Admin navigation
    navItems = [
      { href: "/", label: "홈", icon: HomeIcon },
      { href: "/admin", label: "관리자", icon: UserIcon },
    ];
  } else if (role === "BUSINESS") {
    // Business user navigation
    navItems = [
      { href: "/", label: "홈", icon: HomeIcon },
      { href: "/business/dashboard", label: "광고관리", icon: BriefcaseIcon },
      { href: "/business/resumes", label: "인재정보", icon: DocumentIcon },
      { href: "/notifications", label: "알림", icon: BellIcon },
      { href: "/business/profile", label: "마이", icon: UserIcon },
    ];
  } else if (role === "JOBSEEKER") {
    // Jobseeker user navigation
    navItems = [
      { href: "/", label: "홈", icon: HomeIcon },
      { href: "/jobs", label: "채용정보", icon: SearchIcon },
      { href: "/jobseeker/my-resume", label: "이력서", icon: DocumentIcon },
      { href: "/jobseeker/scraps", label: "스크랩", icon: BookmarkIcon },
      { href: "/notifications", label: "알림", icon: BellIcon },
      { href: "/jobseeker/profile", label: "마이", icon: UserIcon },
    ];
  } else {
    // Not logged in navigation
    navItems = [
      { href: "/", label: "홈", icon: HomeIcon },
      { href: "/jobs", label: "채용정보", icon: SearchIcon },
      { href: "/login", label: "로그인", icon: UserIcon },
    ];
  }

  return (
    <nav className="fixed bottom-0 left-0 z-50 w-full border-t border-border bg-background md:hidden">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const isNotificationItem = item.href === "/notifications";
          const showBadge = isNotificationItem && unreadCount > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-1 py-3 text-[11px] ${
                isActive
                  ? "text-primary font-bold"
                  : "text-muted-foreground"
              }`}
              aria-label={showBadge ? `${item.label} (${unreadCount}개 알림)` : item.label}
              aria-current={isActive ? "page" : undefined}
            >
              <div className="relative">
                <item.icon className="h-6 w-6" />
                {showBadge && (
                  <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500" aria-hidden="true" />
                )}
              </div>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
