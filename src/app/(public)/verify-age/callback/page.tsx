"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

function VerifyAgeCallbackContent() {
  const searchParams = useSearchParams();
  const identityVerificationId = searchParams.get("identityVerificationId");
  const code = searchParams.get("code");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    // PortOne에서 에러 코드와 함께 리다이렉트된 경우
    if (code) {
      setStatus("error");
      setMessage("본인인증이 취소되었거나 실패했습니다.");
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
      return;
    }

    if (!identityVerificationId) {
      setStatus("error");
      setMessage("인증 정보가 없습니다.");
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
      return;
    }

    // 서버에서 인증 결과 확인
    fetch("/api/auth/verify-age", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identityVerificationId }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setMessage("본인인증이 완료되었습니다. 잠시 후 이동합니다...");
          setTimeout(() => {
            window.location.href = "/";
          }, 1500);
        } else {
          if (data.underage) {
            setStatus("error");
            setMessage("만 19세 미만은 이용할 수 없습니다.");
            setTimeout(() => {
              window.location.href = "https://www.google.com";
            }, 2000);
          } else {
            setStatus("error");
            setMessage(data.error || "인증 처리 중 오류가 발생했습니다.");
            setTimeout(() => {
              window.location.href = "/";
            }, 3000);
          }
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("인증 처리 중 오류가 발생했습니다.");
        setTimeout(() => {
          window.location.href = "/";
        }, 3000);
      });
  }, [identityVerificationId, code]);

  return (
    <Card className="mx-4 w-full max-w-md border-2 shadow-2xl">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">
          {status === "loading" && "본인인증 확인 중..."}
          {status === "success" && "인증 완료"}
          {status === "error" && "인증 실패"}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        {status === "loading" && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-8 w-8 animate-spin text-[#D4A853]" />
          </div>
        )}
        {status === "success" && (
          <div className="space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-muted-foreground">{message}</p>
          </div>
        )}
        {status === "error" && (
          <p className="text-muted-foreground">{message}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function VerifyAgeCallbackPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black/80 px-4">
      <Suspense
        fallback={
          <Card className="mx-4 w-full max-w-md">
            <CardContent className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#D4A853]" />
            </CardContent>
          </Card>
        }
      >
        <VerifyAgeCallbackContent />
      </Suspense>
    </div>
  );
}
