"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface DeleteAdButtonProps {
  adId: string;
  isPaidActive: boolean;
}

export function DeleteAdButton({ adId, isPaidActive }: DeleteAdButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/ads/${adId}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs text-destructive">
          {isPaidActive ? "광고를 내리시겠습니까? 남은 기간은 환불되지 않습니다." : "정말 삭제하시겠습니까?"}
        </span>
        <Button
          size="sm"
          variant="destructive"
          className="text-xs"
          onClick={handleDelete}
          disabled={loading}
        >
          {loading ? "처리중..." : "확인"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-xs"
          onClick={() => setShowConfirm(false)}
          disabled={loading}
        >
          취소
        </Button>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      className="text-xs text-destructive hover:text-destructive"
      onClick={() => setShowConfirm(true)}
    >
      {isPaidActive ? "광고 내리기" : "삭제"}
    </Button>
  );
}
