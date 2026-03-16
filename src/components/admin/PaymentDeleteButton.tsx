"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface Props {
  paymentId: string;
}

export function PaymentDeleteButton({ paymentId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("이 결제 기록을 삭제하시겠습니까?\n삭제된 광고의 결제 기록이 영구 삭제됩니다.")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}/delete`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "삭제 실패");
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
      variant="outline"
      onClick={handleDelete}
      disabled={loading}
      className="text-red-400 border-red-800/50 hover:bg-red-950/50"
    >
      {loading ? "삭제중..." : "기록 삭제"}
    </Button>
  );
}
