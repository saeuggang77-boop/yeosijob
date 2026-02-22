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
            <Label htmlFor="businessNumber">
              사업자등록번호{" "}
              <span className="text-muted-foreground font-normal">
                (선택)
              </span>
            </Label>
            <Input
              id="businessNumber"
              name="businessNumber"
              placeholder="1234567890 (10자리)"
              maxLength={10}
            />
            <p className="text-xs text-muted-foreground">
              입력하시면 인증업소 배지를 받을 수 있습니다
            </p>
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
            <Link href="/register" className="hover:underline">
              구직자 회원가입
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
