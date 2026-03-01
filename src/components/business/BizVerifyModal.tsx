"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

interface BizVerifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
}

export function BizVerifyModal({ isOpen, onClose, onVerified }: BizVerifyModalProps) {
  const [businessNumber, setBusinessNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 숫자만 허용, 최대 10자리
    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
    setBusinessNumber(value);
    setMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (businessNumber.length !== 10) {
      setMessage("사업자등록번호 10자리를 입력해주세요");
      setIsSuccess(false);
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/auth/verify-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessNumber }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "인증에 실패했습니다");
        setIsSuccess(false);
        return;
      }

      setMessage(data.message || "사업자 인증이 완료되었습니다!");
      setIsSuccess(true);
      setTimeout(() => {
        onVerified();
        onClose();
      }, 1500);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "서버 오류가 발생했습니다");
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <Card className="relative z-10 w-full max-w-md shadow-2xl">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>사업자 인증</CardTitle>
              <CardDescription className="mt-2">
                광고 등록을 위해 사업자등록번호를 인증해주세요
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              className="shrink-0"
            >
              <X className="size-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessNumber">사업자등록번호</Label>
              <Input
                id="businessNumber"
                type="text"
                inputMode="numeric"
                placeholder="0000000000"
                value={businessNumber}
                onChange={handleInputChange}
                disabled={loading}
                maxLength={10}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                10자리 숫자를 입력해주세요 (하이픈 제외)
              </p>
            </div>

            {message && (
              <div
                className={`rounded-md p-3 text-sm ${
                  isSuccess
                    ? "bg-green-500/10 text-green-600 dark:text-green-400"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {message}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="flex-1"
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={loading || businessNumber.length !== 10}
                className="flex-1"
              >
                {loading ? "인증 중..." : "인증하기"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );

  // Use portal to render modal at document.body level
  if (typeof document !== "undefined") {
    return createPortal(modalContent, document.body);
  }

  return null;
}
