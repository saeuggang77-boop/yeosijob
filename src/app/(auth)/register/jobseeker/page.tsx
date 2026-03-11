"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons";
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
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다");
      setLoading(false);
      return;
    }

    const data = {
      type: "JOBSEEKER",
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      password,
      confirmPassword,
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

      // 자동 로그인
      const signInResult = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (signInResult?.error) {
        router.push("/login?registered=true");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("회원가입 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold"><h1>구직자 회원가입</h1></CardTitle>
        <CardDescription>
          무료로 가입하고 일자리를 찾아보세요
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <SocialLoginButtons mode="register" role="JOBSEEKER" />

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">또는 이메일로 가입</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">닉네임</Label>
            <Input
              id="name"
              name="name"
              placeholder="활동할 닉네임"
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
              onChange={(e) => {
                e.target.value = e.target.value.replace(/[^0-9]/g, "");
              }}
            />
            <p className="text-xs text-muted-foreground">숫자만 입력 (&apos;-&apos; 자동 제거)</p>
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
