"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface Props {
  paymentId: string;
}

export function PaymentActions({ paymentId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "cancel" | null>(null);

  async function handleApprove() {
    if (!confirm("입금을 확인하고 광고를 게재하시겠습니까?")) return;

    setLoading("approve");
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}/approve`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "처리 실패");
        return;
      }
      router.refresh();
    } catch {
      alert("서버 오류가 발생했습니다");
    } finally {
      setLoading(null);
    }
  }

  async function handleCancel() {
    if (!confirm("이 결제를 취소하시겠습니까?\n입금 대기가 취소되며 광고가 게재되지 않습니다.")) return;

    setLoading("cancel");
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}/cancel`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "취소 실패");
        return;
      }
      router.refresh();
    } catch {
      alert("서버 오류가 발생했습니다");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        onClick={handleApprove}
        disabled={!!loading}
        className="bg-green-600 hover:bg-green-700"
      >
        {loading === "approve" ? "처리중..." : "입금확인"}
      </Button>
      <Button
        size="sm"
        variant="destructive"
        onClick={handleCancel}
        disabled={!!loading}
      >
        {loading === "cancel" ? "처리중..." : "취소"}
      </Button>
    </div>
  );
}
