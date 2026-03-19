"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

function VerifyAgeCallbackContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const reason = searchParams.get("reason");
  const [message, setMessage] = useState("");
  const [displayStatus, setDisplayStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    if (status === "success") {
      queueMicrotask(() => {
        setDisplayStatus("success");
        setMessage("본인인증이 완료되었습니다. 잠시 후 이동합니다...");
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
      return;
    }

    if (status === "error") {
      queueMicrotask(() => {
        setDisplayStatus("error");

        switch (reason) {
          case "underage":
            setMessage("만 19세 미만은 이용할 수 없습니다.");
            setTimeout(() => {
              window.location.href = "https://www.google.com";
            }, 2000);
            break;
          case "cancelled":
            setMessage("본인인증이 취소되었습니다.");
            setTimeout(() => {
              window.location.href = "/";
            }, 2000);
            break;
          case "tampered":
            setMessage("인증 데이터 무결성 검증에 실패했습니다.");
            setTimeout(() => {
              window.location.href = "/";
            }, 3000);
            break;
          default:
            setMessage("인증 처리 중 오류가 발생했습니다.");
            setTimeout(() => {
              window.location.href = "/";
            }, 3000);
            break;
        }
      });
      return;
    }

    // status 없음 — 잘못된 접근
    queueMicrotask(() => {
      setDisplayStatus("error");
      setMessage("잘못된 접근입니다.");
    });
    setTimeout(() => {
      window.location.href = "/";
    }, 2000);
  }, [status, reason]);

  return (
    <Card className="mx-4 w-full max-w-md border-2 shadow-2xl">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">
          {displayStatus === "loading" && "본인인증 처리 중..."}
          {displayStatus === "success" && "인증 완료"}
          {displayStatus === "error" && "인증 실패"}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        {displayStatus === "loading" && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-8 w-8 animate-spin text-[#D4A853]" />
          </div>
        )}
        {displayStatus === "success" && (
          <div className="space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-muted-foreground">{message}</p>
          </div>
        )}
        {displayStatus === "error" && (
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
