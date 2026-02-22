"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-screen-xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-primary">여시알바</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link href="/">
            <Button variant="ghost" size="sm">
              채용정보
            </Button>
          </Link>
          {session?.user.role === "BUSINESS" && (
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                광고관리
              </Button>
            </Link>
          )}
          {session?.user.role === "JOBSEEKER" && (
            <Link href="/my-resume">
              <Button variant="ghost" size="sm">
                내 이력서
              </Button>
            </Link>
          )}
          {session?.user.role === "ADMIN" && (
            <Link href="/admin/dashboard">
              <Button variant="ghost" size="sm">
                관리자
              </Button>
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {session ? (
            <>
              <span className="hidden text-sm text-muted-foreground md:inline">
                {session.user.name}님
              </span>
              {session.user.role === "BUSINESS" && (
                <Link href="/ads/new">
                  <Button size="sm">광고등록</Button>
                </Link>
              )}
              {session.user.role === "JOBSEEKER" && (
                <Link href="/my-resume">
                  <Button size="sm">이력서 등록</Button>
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
                <Button size="sm">광고등록</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
