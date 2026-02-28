"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("이메일 또는 비밀번호가 올바르지 않습니다");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("로그인 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md bg-card">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">여시잡</CardTitle>
        <CardDescription>로그인하여 서비스를 이용해보세요</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="example@email.com"
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">비밀번호</Label>
              <Link
                href="/reset-password"
                className="text-xs text-muted-foreground hover:underline"
              >
                비밀번호를 잊으셨나요?
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="비밀번호 입력"
              required
              minLength={6}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "로그인 중..." : "로그인"}
          </Button>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">또는</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => signIn("kakao", { callbackUrl: "/" })}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#FEE500] text-sm font-medium text-[#000000D9] transition-colors hover:bg-[#FDD835]"
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path
                fill="#000000D9"
                d="M9 1C4.58 1 1 3.79 1 7.21c0 2.17 1.42 4.07 3.56 5.14l-.91 3.34c-.08.28.24.5.48.34l3.96-2.62c.29.03.59.05.91.05 4.42 0 8-2.79 8-6.25S13.42 1 9 1z"
              />
            </svg>
            카카오 로그인
          </button>

          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-md border bg-white text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92a8.78 8.78 0 0 0 2.68-6.62z" />
              <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.83.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A8.99 8.99 0 0 0 9 18z" />
              <path fill="#FBBC05" d="M3.97 10.71A5.41 5.41 0 0 1 3.69 9c0-.6.1-1.17.28-1.71V4.96H.96A8.99 8.99 0 0 0 0 9c0 1.45.35 2.82.96 4.04l3.01-2.33z" />
              <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A8.99 8.99 0 0 0 .96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
            </svg>
            Google 로그인
          </button>

          <div className="flex gap-2 text-sm text-muted-foreground">
            <Link href="/register" className="hover:underline">
              구직자 회원가입
            </Link>
            <span>|</span>
            <Link href="/register/business" className="hover:underline">
              업소 회원가입
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
