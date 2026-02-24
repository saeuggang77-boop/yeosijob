"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { NotificationBell } from "@/components/notification/NotificationBell";
import { Menu } from "lucide-react";

export function Header() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      onClick={() => setOpen(false)}
      className="rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/85">
      <div className="mx-auto flex h-14 max-w-screen-xl items-center justify-between px-4">
        {/* Left: Hamburger + Logo */}
        <div className="flex items-center gap-2">
          {/* Mobile hamburger */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="메뉴 열기">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <div className="flex flex-col p-6">
                <span className="text-xl font-bold text-primary">여시잡</span>
                <p className="mt-1 text-xs text-muted-foreground">
                  유흥업계 No.1 구인구직
                </p>
              </div>
              <Separator />
              <nav className="flex flex-col gap-1 p-4">
                {navLink("/jobs", "채용정보")}
                {navLink("/resumes", "인재정보")}
                {navLink("/community", "커뮤니티")}
                {navLink("/pricing", "광고안내")}
                {navLink("/notice", "공지사항")}
              </nav>
              <Separator />
              <nav className="flex flex-col gap-1 p-4">
                {session?.user.role === "JOBSEEKER" && (
                  <>
                    {navLink("/jobseeker/my-resume", "내 이력서")}
                    {navLink("/jobseeker/scraps", "스크랩")}
                    {navLink("/jobseeker/reviews", "내 후기")}
                  </>
                )}
                {session?.user.role === "BUSINESS" && (
                  <>
                    {navLink("/business/dashboard", "광고관리")}
                    {navLink("/business/ads/new", "광고등록")}
                  </>
                )}
                {session?.user.role === "ADMIN" && (
                  <>
                    {navLink("/admin", "관리자")}
                  </>
                )}
                {!session && (
                  <>
                    {navLink("/login", "로그인")}
                    {navLink("/register/business", "회원가입")}
                  </>
                )}
                {session && (
                  <>
                    <Separator className="my-2" />
                    <div className="px-3 py-1 text-xs text-muted-foreground">
                      {session.user.name}님
                    </div>
                    <button
                      onClick={() => {
                        setOpen(false);
                        signOut({ callbackUrl: "/" });
                      }}
                      className="rounded-md px-3 py-2 text-left text-sm font-medium text-destructive transition-colors hover:bg-muted"
                      aria-label="로그아웃"
                    >
                      로그아웃
                    </button>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>

          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary">여시잡</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          <Link href="/jobs">
            <Button variant="ghost" size="sm">
              채용정보
            </Button>
          </Link>
          <Link href="/resumes">
            <Button variant="ghost" size="sm">
              인재정보
            </Button>
          </Link>
          <Link href="/community">
            <Button variant="ghost" size="sm">
              커뮤니티
            </Button>
          </Link>
          <Link href="/pricing">
            <Button variant="ghost" size="sm">
              광고안내
            </Button>
          </Link>
          {session?.user.role === "JOBSEEKER" && (
            <>
              <Link href="/jobseeker/my-resume">
                <Button variant="ghost" size="sm">
                  내 이력서
                </Button>
              </Link>
              <Link href="/jobseeker/scraps">
                <Button variant="ghost" size="sm">
                  스크랩
                </Button>
              </Link>
            </>
          )}
          {session?.user.role === "BUSINESS" && (
            <>
              <Link href="/business/dashboard">
                <Button variant="ghost" size="sm">
                  광고관리
                </Button>
              </Link>
            </>
          )}
          {session?.user.role === "ADMIN" && (
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                관리자
              </Button>
            </Link>
          )}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {session ? (
            <>
              <NotificationBell />
              <span className="hidden text-sm text-muted-foreground md:inline">
                {session.user.name}님
              </span>
              {session.user.role === "BUSINESS" && (
                <Link href="/business/ads/new">
                  <Button size="sm">광고등록</Button>
                </Link>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="hidden md:inline-flex"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                로그아웃
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="hidden md:inline-flex">
                  로그인
                </Button>
              </Link>
              <Link href="/register/business">
                <Button size="sm" className="hidden md:inline-flex">회원가입</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
