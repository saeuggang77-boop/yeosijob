"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { NotificationBell } from "@/components/notification/NotificationBell";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/85">
      <div className="mx-auto flex h-14 max-w-screen-xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-primary">여시잡</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link href="/jobs">
            <Button variant="ghost" size="sm">
              채용정보
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
          <Link href="/notice">
            <Button variant="ghost" size="sm">
              공지사항
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
              <Link href="/business/resumes">
                <Button variant="ghost" size="sm">
                  인재정보
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
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                로그아웃
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  로그인
                </Button>
              </Link>
              <Link href="/register/business">
                <Button size="sm">회원가입</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
