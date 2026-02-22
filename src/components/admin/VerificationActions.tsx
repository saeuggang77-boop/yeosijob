"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function VerificationActions({ userId }: { userId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handle(action: "approve" | "reject") {
    if (!confirm(action === "approve" ? "인증을 승인하시겠습니까?" : "인증을 반려하시겠습니까?")) return;
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

  return (
    <div className="flex gap-2">
      <Button size="sm" disabled={loading} onClick={() => handle("approve")}>승인</Button>
      <Button size="sm" variant="destructive" disabled={loading} onClick={() => handle("reject")}>반려</Button>
    </div>
  );
}
