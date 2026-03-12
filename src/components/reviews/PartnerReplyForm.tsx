"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface PartnerReplyFormProps {
  reviewId: string;
  existingReply?: string | null;
}

export function PartnerReplyForm({ reviewId, existingReply }: PartnerReplyFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [reply, setReply] = useState(existingReply || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/partner-reviews/${reviewId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "답글 작성에 실패했습니다");
        return;
      }

      setIsOpen(false);
      router.refresh();
    } catch {
      setError("서버 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) {
    return (
      <Button
        size="sm"
        variant="ghost"
        className="mt-1 h-7 text-xs text-muted-foreground"
        onClick={() => setIsOpen(true)}
      >
        {existingReply ? "답글 수정" : "답글 달기"}
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 space-y-2">
      <textarea
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        placeholder="답글을 입력하세요 (5자 이상)"
        className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        rows={3}
        maxLength={500}
      />
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={loading || reply.length < 5}>
          {loading ? "등록 중..." : existingReply ? "수정" : "등록"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => {
            setIsOpen(false);
            setReply(existingReply || "");
            setError("");
          }}
        >
          취소
        </Button>
        <span className="text-xs text-muted-foreground">{reply.length}/500</span>
      </div>
    </form>
  );
}
