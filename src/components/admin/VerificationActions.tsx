"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function VerificationActions({ userId, isVerified }: { userId: string; isVerified: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handle(action: "approve" | "revoke") {
    const msg = action === "revoke"
      ? "이 사업자의 인증을 취소하시겠습니까?\n광고의 인증 뱃지도 함께 제거됩니다."
      : "이 사업자의 인증을 수동 승인하시겠습니까?";
    if (!confirm(msg)) return;

    setLoading(true);
    try {
      await fetch(`/api/admin/verification/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      router.refresh();
    } catch {
      alert("처리 실패");
    } finally {
      setLoading(false);
    }
  }

  if (isVerified) {
    return (
      <Button size="sm" variant="destructive" disabled={loading} onClick={() => handle("revoke")}>
        인증 취소
      </Button>
    );
  }

  return (
    <Button size="sm" variant="outline" disabled={loading} onClick={() => handle("approve")}>
      수동 승인
    </Button>
  );
}
