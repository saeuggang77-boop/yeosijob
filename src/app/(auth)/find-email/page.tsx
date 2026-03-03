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

export default function FindEmailPage() {
  const [found, setFound] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 전화번호 포맷팅: 010-1234-5678
  function formatPhone(value: string) {
    const numbers = value.replace(/[^0-9]/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const phone = formData.get("phone") as string;

    try {
      const res = await fetch("/api/auth/find-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "오류가 발생했습니다");
        return;
      }

      setMaskedEmail(result.maskedEmail);
      setFound(true);
    } catch {
      setError("서버 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }

  if (found) {
    return (
      <Card className="w-full max-w-md bg-card">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-xl">
            ✓
          </div>
          <CardTitle className="mt-2 text-xl font-bold">이메일 찾기 완료</CardTitle>
          <CardDescription>
            해당 전화번호로 가입된 이메일을 찾았습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="rounded-md bg-muted p-4">
            <p className="text-sm text-muted-foreground mb-2">가입된 이메일</p>
            <p className="text-lg font-semibold">{maskedEmail}</p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Link href="/login" className="w-full">
            <Button variant="default" className="w-full">
              로그인하기
            </Button>
          </Link>
          <Link href="/forgot-password" className="w-full">
            <Button variant="outline" className="w-full">
              비밀번호 찾기
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md bg-card">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">이메일 찾기</CardTitle>
        <CardDescription>
          가입 시 입력하신 전화번호를 입력하시면 이메일을 찾아드립니다.
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
            <Label htmlFor="phone">전화번호</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="010-1234-5678"
              required
              maxLength={13}
              onChange={(e) => {
                e.target.value = formatPhone(e.target.value);
              }}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "찾는 중..." : "이메일 찾기"}
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
