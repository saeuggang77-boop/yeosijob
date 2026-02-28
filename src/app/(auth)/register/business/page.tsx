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
import { Separator } from "@/components/ui/separator";

export default function RegisterBusinessPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [bizNum, setBizNum] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      type: "BUSINESS",
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
      businessName: formData.get("businessName"),
      businessNumber: formData.get("businessNumber"),
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
        <CardTitle className="text-2xl font-bold">업소 회원가입</CardTitle>
        <CardDescription>
          광고를 등록하고 인재를 찾아보세요
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
            <Label htmlFor="name">담당자명</Label>
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

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="businessName">업소명</Label>
            <Input
              id="businessName"
              name="businessName"
              placeholder="업소 이름"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="businessNumber">사업자등록번호</Label>
            <Input
              id="businessNumber"
              name="businessNumber"
              placeholder="1234567890 (10자리)"
              required
              pattern="\d{10}"
              maxLength={10}
              onInput={(e) => {
                const input = e.currentTarget;
                input.value = input.value.replace(/\D/g, "");
                setBizNum(input.value);
              }}
            />
            {bizNum.length > 0 && bizNum.length < 10 && (
              <p className="text-xs text-muted-foreground">
                10자리를 입력해주세요 ({bizNum.length}/10)
              </p>
            )}
            {bizNum.length === 10 && (
              <p className="flex items-center gap-1 text-xs text-green-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                형식 확인
              </p>
            )}
            {bizNum.length === 0 && (
              <p className="text-xs text-muted-foreground">
                사업자등록번호 인증은 법적 필수사항입니다
              </p>
            )}
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
            {loading ? "가입 중..." : "업소 가입하기"}
          </Button>
          <div className="flex gap-2 text-sm text-muted-foreground">
            <Link href="/login" className="hover:underline">
              로그인
            </Link>
            <span>|</span>
            <Link href="/register/jobseeker" className="hover:underline">
              구직자 회원가입
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
