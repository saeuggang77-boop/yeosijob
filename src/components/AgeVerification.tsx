"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const STORE_ID = process.env.NEXT_PUBLIC_PORTONE_STORE_ID || "";
const CHANNEL_KEY = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY || "";
const HAS_PORTONE = !!(STORE_ID && CHANNEL_KEY);

// localStorage 폴백용 (PortOne 키 미설정 시 개발 편의)
const AGE_VERIFIED_KEY = "age_verified";

export function AgeVerification() {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setIsMounted(true);

    if (HAS_PORTONE) {
      // 쿠키 기반: 서버에서 상태 확인
      fetch("/api/auth/verify-age/status")
        .then((res) => res.json())
        .then((data) => {
          if (!data.verified) {
            setIsVisible(true);
            document.body.style.overflow = "hidden";
          }
        })
        .catch(() => {
          setIsVisible(true);
          document.body.style.overflow = "hidden";
        });
    } else {
      // 폴백: localStorage 기반 (개발용)
      const isVerified = localStorage.getItem(AGE_VERIFIED_KEY);
      if (!isVerified) {
        setIsVisible(true);
        document.body.style.overflow = "hidden";
      }
    }
  }, []);

  const handlePortOneVerify = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const PortOne = await import("@portone/browser-sdk/v2");

      const identityVerificationId = `identity-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const response = await PortOne.requestIdentityVerification({
        storeId: STORE_ID,
        identityVerificationId,
        channelKey: CHANNEL_KEY,
      });

      if (response?.code) {
        if (response.code === "IDENTITY_VERIFICATION_STOPPED") {
          setIsLoading(false);
          return;
        }
        setError(response.message || "본인인증에 실패했습니다");
        setIsLoading(false);
        return;
      }

      // 서버에서 인증 결과 확인
      const verifyRes = await fetch("/api/auth/verify-age", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identityVerificationId: response?.identityVerificationId || identityVerificationId,
        }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        if (verifyData.underage) {
          // 미성년자 → 리다이렉트
          window.location.href = "https://www.google.com";
          return;
        }
        setError(verifyData.error || "인증 처리 중 오류가 발생했습니다");
        setIsLoading(false);
        return;
      }

      // 인증 성공 → 페이지 리로드
      document.body.style.overflow = "unset";
      window.location.reload();
    } catch (err) {
      console.error("PortOne verification error:", err);
      setError("본인인증 처리 중 오류가 발생했습니다");
      setIsLoading(false);
    }
  }, []);

  const handleFallbackConfirm = () => {
    localStorage.setItem(AGE_VERIFIED_KEY, "true");
    setIsVisible(false);
    document.body.style.overflow = "unset";
  };

  const handleDeny = () => {
    window.location.href = "https://www.google.com";
  };

  if (!isMounted || !isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <Card className="mx-4 w-full max-w-md border-2 shadow-2xl">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-[#D4A853]/10">
            <svg
              className="h-10 w-10 text-[#D4A853]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold">본인인증</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2 text-center">
            <p className="text-lg font-medium">
              본 사이트는 청소년유해매체물로
              <br />
              성인만 이용 가능합니다.
            </p>
            <p className="text-sm text-muted-foreground">
              {HAS_PORTONE
                ? "휴대폰 본인인증을 통해 성인 여부를 확인합니다."
                : "만 19세 이상이십니까?"}
            </p>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-center text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-3">
            {HAS_PORTONE ? (
              <Button
                onClick={handlePortOneVerify}
                disabled={isLoading}
                className="h-12 w-full bg-[#D4A853] text-base font-semibold text-black hover:bg-[#C49A48]"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    인증 진행 중...
                  </>
                ) : (
                  "휴대폰 본인인증하기"
                )}
              </Button>
            ) : (
              <Button
                onClick={handleFallbackConfirm}
                className="h-12 w-full bg-[#D4A853] text-base font-semibold text-black hover:bg-[#C49A48]"
                size="lg"
              >
                예, 19세 이상입니다
              </Button>
            )}

            <Button
              onClick={handleDeny}
              variant="outline"
              className="h-12 w-full text-base"
              size="lg"
            >
              19세 미만이신가요? 나가기
            </Button>
          </div>

          {HAS_PORTONE && (
            <p className="text-center text-xs text-muted-foreground">
              인증 정보는 성인 확인 목적으로만 사용되며,
              <br />
              30일간 유효합니다.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
