"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const REASONS = [
  { value: "ABUSE", label: "욕설/비방" },
  { value: "OBSCENE", label: "음란물" },
  { value: "SPAM", label: "광고/홍보" },
  { value: "PRIVACY", label: "개인정보노출" },
  { value: "OTHER", label: "기타" },
];

interface ReportButtonProps {
  postId?: string;
  commentId?: string;
  isLoggedIn: boolean;
}

export function ReportButton({ postId, commentId, isLoggedIn }: ReportButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleClick = () => {
    if (!isLoggedIn) {
      alert("로그인 후 신고할 수 있습니다");
      return;
    }
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!reason) {
      setError("신고 사유를 선택해주세요");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: postId || null,
          commentId: commentId || null,
          reason,
          detail: detail.trim() || null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("신고가 접수되었습니다");
        setOpen(false);
        setReason("");
        setDetail("");
        router.refresh();
      } else {
        setError(data.error || "신고에 실패했습니다");
      }
    } catch {
      setError("신고 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="text-xs text-muted-foreground hover:text-red-500 transition-colors"
      >
        신고
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-bold">신고하기</h3>

            {/* 사유 선택 */}
            <div className="mb-4 space-y-2">
              <p className="text-sm font-medium">신고 사유</p>
              {REASONS.map((r) => (
                <label
                  key={r.value}
                  className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                    reason === r.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={(e) => setReason(e.target.value)}
                    className="sr-only"
                  />
                  {r.label}
                </label>
              ))}
            </div>

            {/* 상세 내용 */}
            <div className="mb-4">
              <p className="mb-1 text-sm font-medium">상세 내용 (선택)</p>
              <textarea
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="추가 설명이 있다면 입력해주세요"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <p className="mt-1 text-right text-xs text-muted-foreground">
                {detail.length}/500
              </p>
            </div>

            {error && (
              <p className="mb-3 text-sm text-red-500">{error}</p>
            )}

            {/* 버튼 */}
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setOpen(false);
                  setReason("");
                  setDetail("");
                  setError("");
                }}
                disabled={loading}
              >
                취소
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={loading || !reason}
                className="bg-red-600 hover:bg-red-700"
              >
                {loading ? "처리 중..." : "신고하기"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
