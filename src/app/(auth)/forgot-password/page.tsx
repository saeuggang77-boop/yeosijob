"use client";

import { useState } from "react";
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

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "오류가 발생했습니다");
        return;
      }

      setSent(true);
    } catch {
      setError("서버 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <Card className="w-full max-w-md bg-card">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-xl">
            ✉
          </div>
          <CardTitle className="mt-2 text-xl font-bold">이메일 발송 완료</CardTitle>
          <CardDescription>
            입력하신 이메일로 비밀번호 재설정 링크를 발송했습니다.
            이메일을 확인해주세요.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col gap-3">
          <p className="text-xs text-muted-foreground">
            이메일이 도착하지 않으면 스팸함을 확인해주세요.
          </p>
          <Link href="/login" className="w-full">
            <Button variant="outline" className="w-full">
              로그인으로 돌아가기
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md bg-card">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">비밀번호 찾기</CardTitle>
        <CardDescription>
          가입하신 이메일을 입력하시면 비밀번호 재설정 링크를 보내드립니다.
        </CardDescription>
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
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "발송 중..." : "재설정 링크 보내기"}
          </Button>
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:underline"
          >
            로그인으로 돌아가기
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
