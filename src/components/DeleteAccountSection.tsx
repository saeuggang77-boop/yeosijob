"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserX, ChevronRight, ChevronDown } from "lucide-react";

interface DeleteAccountSectionProps {
  hasPassword: boolean;
}

export default function DeleteAccountSection({ hasPassword }: DeleteAccountSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: hasPassword ? password : undefined, confirmation }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      // 성공 시 홈으로 이동 (세션 무효화)
      window.location.href = "/";
    } catch {
      setError("서버 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-red-200 transition-shadow hover:shadow-md dark:border-red-900">
      <CardContent className="p-4">
        <button
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
            setError("");
          }}
          className="flex w-full items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <UserX className="size-5 text-red-500" />
            <span className="font-medium text-red-500">회원 탈퇴</span>
          </div>
          {isOpen ? (
            <ChevronDown className="size-5 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-5 text-muted-foreground" />
          )}
        </button>

        {isOpen && (
          <form onSubmit={handleDelete} className="mt-4 space-y-4">
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              <p className="font-medium">주의: 이 작업은 되돌릴 수 없습니다.</p>
              <p className="mt-1">계정과 모든 데이터(광고, 이력서, 게시글 등)가 영구적으로 삭제됩니다.</p>
            </div>

            {hasPassword && (
              <div className="space-y-2">
                <Label htmlFor="deletePassword">비밀번호 확인</Label>
                <Input
                  id="deletePassword"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="confirmation">
                확인을 위해 <span className="font-bold text-red-500">회원탈퇴</span>를 입력해주세요
              </Label>
              <Input
                id="confirmation"
                type="text"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                placeholder="회원탈퇴"
                required
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button
              type="submit"
              variant="destructive"
              disabled={loading || confirmation !== "회원탈퇴"}
              className="w-full"
            >
              {loading ? "처리 중..." : "회원 탈퇴"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
