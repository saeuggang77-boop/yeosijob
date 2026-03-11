"use client";

import { useEffect, useRef, useState } from "react";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";
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
  const widgetsRef = useRef<Awaited<ReturnType<Awaited<ReturnType<typeof loadTossPayments>>["widgets"]>> | null>(null);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const [ready, setReady] = useState(false);

  const customerKey = customerEmail || `guest_${orderId}`;

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const toss = await loadTossPayments(TOSS_CLIENT_KEY);
        const widgets = toss.widgets({ customerKey });
        await widgets.setAmount({ currency: "KRW", value: amount });

        if (cancelled) return;

        await Promise.all([
          widgets.renderPaymentMethods({
            selector: "#toss-payment-method",
            variantKey: "DEFAULT",
          }),
          widgets.renderAgreement({
            selector: "#toss-agreement",
            variantKey: "AGREEMENT",
          }),
        ]);

        if (cancelled) return;

        widgetsRef.current = widgets;
        setReady(true);
      } catch (err) {
        console.error("Toss Widget init error:", err);
        if (!cancelled) {
          onErrorRef.current?.("결제 모듈 로드에 실패했습니다");
        }
      }
    }

    init();

    return () => {
      cancelled = true;
    };
    // customerKey and amount are stable per mount; re-mount if they change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerKey, amount]);

  async function handlePayment() {
    try {
      const widgets = widgetsRef.current;
      if (!widgets) {
        onError?.("결제 모듈이 준비되지 않았습니다. 페이지를 새로고침해주세요.");
        return;
      }

      const resolvedSuccessUrl = successUrl || `${window.location.origin}/business/ads/new/success`;
      const resolvedFailUrl = failUrl || `${window.location.origin}/business/ads/new/fail`;

      await widgets.requestPayment({
        orderId,
        orderName,
        customerName: customerName || "고객",
        customerEmail: customerEmail || undefined,
        successUrl: resolvedSuccessUrl,
        failUrl: resolvedFailUrl,
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
    <div className="space-y-4">
      <div id="toss-payment-method" className="w-full" />
      <div id="toss-agreement" className="w-full" />
      <Button
        className="h-12 w-full text-base"
        onClick={handlePayment}
        disabled={!ready}
      >
        {ready
          ? `${amount.toLocaleString()}원 결제하기`
          : "결제 모듈 로딩 중..."}
      </Button>
    </div>
  );
}
