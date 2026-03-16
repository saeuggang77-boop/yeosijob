"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  paymentId: string;
}

export function PaymentActions({ paymentId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "cancel" | null>(null);
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [reason, setReason] = useState("");
  const [isRefund, setIsRefund] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");

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
    if (!confirm(isRefund ? "환불 처리하시겠습니까?" : "이 결제를 취소하시겠습니까?")) return;

    setLoading("cancel");
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: reason || "관리자 수동 취소",
          isRefund,
          ...(isRefund && refundAmount ? { refundAmount: Number(refundAmount) } : {}),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "취소 실패");
        return;
      }
      setShowCancelForm(false);
      router.refresh();
    } catch {
      alert("서버 오류가 발생했습니다");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-2">
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
          onClick={() => setShowCancelForm(!showCancelForm)}
          disabled={!!loading}
        >
          취소
        </Button>
      </div>

      {showCancelForm && (
        <div className="rounded-lg border border-red-800/50 bg-red-950/30 p-3 space-y-2">
          <Input
            placeholder="취소 사유 (미입력 시 '관리자 수동 취소')"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="h-8 text-sm"
          />
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={isRefund}
              onChange={(e) => setIsRefund(e.target.checked)}
              className="accent-red-500"
            />
            환불 처리
          </label>
          {isRefund && (
            <Input
              type="number"
              placeholder="환불 금액 (원)"
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              className="h-8 text-sm"
            />
          )}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={handleCancel}
              disabled={!!loading}
            >
              {loading === "cancel" ? "처리중..." : isRefund ? "환불 처리" : "취소 확정"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setShowCancelForm(false); setReason(""); setIsRefund(false); setRefundAmount(""); }}
              disabled={!!loading}
            >
              닫기
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
