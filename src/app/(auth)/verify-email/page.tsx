"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      queueMicrotask(() => {
        setStatus("error");
        setMessage("인증 토큰이 없습니다.");
      });
      return;
    }

    fetch(`/api/auth/verify-email?token=${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setMessage(data.message);
        } else {
          setStatus("error");
          setMessage(data.error);
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("인증 처리 중 오류가 발생했습니다.");
      });
  }, [token]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">
          {status === "loading" && "이메일 인증 중..."}
          {status === "success" && "인증 완료"}
          {status === "error" && "인증 실패"}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        {status === "loading" && (
          <div className="flex justify-center py-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        )}
        {status !== "loading" && (
          <>
            <p className="mb-6 text-muted-foreground">{message}</p>
            <Link href="/login">
              <Button className="w-full">로그인하기</Button>
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Suspense
        fallback={
          <Card className="w-full max-w-md">
            <CardContent className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </CardContent>
          </Card>
        }
      >
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
