"use client";

import { useEffect, useRef, useState } from "react";
import { loadTossPayments } from "@tosspayments/payment-sdk";
import { TOSS_CLIENT_KEY } from "@/lib/toss/client";
import { Button } from "@/components/ui/button";

interface Props {
  orderId: string;
  orderName: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  successUrl?: string;
  failUrl?: string;
  onError?: (message: string) => void;
}

export function TossPaymentWidget({
  orderId,
  orderName,
  amount,
  customerName,
  customerEmail,
  successUrl,
  failUrl,
  onError,
}: Props) {
  const tossRef = useRef<Awaited<ReturnType<typeof loadTossPayments>> | null>(null);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    loadTossPayments(TOSS_CLIENT_KEY)
      .then((tp) => {
        if (!cancelled) {
          tossRef.current = tp;
          setReady(true);
        }
      })
      .catch((err) => {
        console.error("Toss SDK load error:", err);
        if (!cancelled) {
          const msg = err instanceof Error
            ? err.message
            : (err as { message?: string })?.message || "결제 모듈 로드에 실패했습니다";
          onErrorRef.current?.(msg);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handlePayment(method: "카드" | "가상계좌") {
    try {
      const toss = tossRef.current;
      if (!toss) {
        onError?.("결제 모듈이 준비되지 않았습니다. 페이지를 새로고침해주세요.");
        return;
      }

      const resolvedSuccessUrl = successUrl || `${window.location.origin}/business/ads/new/success`;
      const resolvedFailUrl = failUrl || `${window.location.origin}/business/ads/new/fail`;

      await toss.requestPayment(method, {
        amount,
        orderId,
        orderName,
        customerName: customerName || "고객",
        customerEmail: customerEmail || undefined,
        successUrl: resolvedSuccessUrl,
        failUrl: resolvedFailUrl,
        ...(method === "가상계좌" ? { validHours: 48 } : {}),
      });
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code || "";
      const message =
        error instanceof Error
          ? error.message
          : (error as { message?: string })?.message || "결제 요청 중 오류가 발생했습니다";

      if (code === "USER_CANCEL" || message.includes("USER_CANCEL")) return;

      console.error("Toss payment error:", error);
      onError?.(message);
    }
  }

  return (
    <div className="space-y-3">
      <Button
        className="h-12 w-full text-base"
        onClick={() => handlePayment("카드")}
        disabled={!ready}
      >
        {ready
          ? `카드 ${amount.toLocaleString()}원 결제`
          : "결제 모듈 로딩 중..."}
      </Button>
      <Button
        variant="outline"
        className="h-12 w-full text-base"
        onClick={() => handlePayment("가상계좌")}
        disabled={!ready}
      >
        가상계좌 {amount.toLocaleString()}원 발급
      </Button>
    </div>
  );
}
