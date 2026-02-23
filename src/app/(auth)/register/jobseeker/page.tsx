"use client";

import { useState } from "react";
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

export default function RegisterJobseekerPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      type: "JOBSEEKER",
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    };

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error);
        return;
      }

      router.push("/login?registered=true");
    } catch {
      setError("회원가입 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">구직자 회원가입</CardTitle>
        <CardDescription>
          무료로 가입하고 일자리를 찾아보세요<br />
          <span className="text-xs">카카오 로그인으로도 간편하게 가입할 수 있습니다</span>
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
            <Label htmlFor="name">이름</Label>
            <Input
              id="name"
              name="name"
              placeholder="홍길동"
              required
              minLength={2}
            />
          </div>
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
            <Label htmlFor="phone">휴대폰 번호</Label>
            <Input
              id="phone"
              name="phone"
              placeholder="01012345678"
              required
              pattern="01[016789]\d{7,8}"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="6자 이상"
              required
              minLength={6}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">비밀번호 확인</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="비밀번호 재입력"
              required
              minLength={6}
            />
          </div>

          <div className="space-y-3 rounded-md border p-3">
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" name="agreeTerms" required className="mt-0.5 h-4 w-4 shrink-0 rounded border" />
              <span>
                <Link href="/terms" target="_blank" className="font-medium text-primary underline">이용약관</Link>에 동의합니다 (필수)
              </span>
            </label>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" name="agreePrivacy" required className="mt-0.5 h-4 w-4 shrink-0 rounded border" />
              <span>
                <Link href="/privacy" target="_blank" className="font-medium text-primary underline">개인정보처리방침</Link>에 동의합니다 (필수)
              </span>
            </label>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" name="agreeAge" required className="mt-0.5 h-4 w-4 shrink-0 rounded border" />
              <span>만 19세 이상입니다 (필수)</span>
            </label>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "가입 중..." : "가입하기"}
          </Button>
          <div className="flex gap-2 text-sm text-muted-foreground">
            <Link href="/login" className="hover:underline">
              로그인
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
