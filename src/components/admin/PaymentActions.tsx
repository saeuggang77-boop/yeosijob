"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface Props {
  paymentId: string;
}

export function PaymentActions({ paymentId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleApprove() {
    if (!confirm("입금을 확인하고 광고를 게재하시겠습니까?")) return;

    setLoading(true);
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
      setLoading(false);
    }
  }

  return (
    <Button
      size="sm"
      onClick={handleApprove}
      disabled={loading}
      className="bg-green-600 hover:bg-green-700"
    >
      {loading ? "처리중..." : "입금확인"}
    </Button>
  );
}
