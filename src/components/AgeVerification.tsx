"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const AGE_VERIFIED_KEY = "age_verified";

export function AgeVerification() {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    // Check if user has already verified their age
    const isVerified = localStorage.getItem(AGE_VERIFIED_KEY);
    if (!isVerified) {
      setIsVisible(true);
      // Prevent scrolling when popup is visible
      document.body.style.overflow = "hidden";
    }
  }, []);

  const handleConfirm = () => {
    localStorage.setItem(AGE_VERIFIED_KEY, "true");
    setIsVisible(false);
    // Re-enable scrolling
    document.body.style.overflow = "unset";
  };

  const handleDeny = () => {
    // Redirect to Google
    window.location.href = "https://www.google.com";
  };

  // Don't render during SSR or if not visible to avoid hydration mismatch
  if (!isMounted || !isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-4 shadow-2xl border-2">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mb-2">
            <svg
              className="w-10 h-10 text-yellow-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold">성인 인증</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-lg font-medium">
              이 사이트는 만 19세 이상만 이용할 수 있습니다.
            </p>
            <p className="text-sm text-muted-foreground">
              만 19세 이상이십니까?
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleConfirm}
              className="w-full h-12 text-base font-semibold"
              size="lg"
            >
              예, 19세 이상입니다
            </Button>
            <Button
              onClick={handleDeny}
              variant="outline"
              className="w-full h-12 text-base"
              size="lg"
            >
              아니오, 19세 미만입니다
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
