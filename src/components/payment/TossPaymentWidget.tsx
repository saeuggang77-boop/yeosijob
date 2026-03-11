"use client";

import { useEffect, useRef } from "react";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";
import { TOSS_CLIENT_KEY } from "@/lib/toss/client";
import { Button } from "@/components/ui/button";

interface Props {
  orderId: string;
  orderName: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  method: "CARD" | "KAKAO_PAY" | "BANK_TRANSFER";
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
  method,
  successUrl,
  failUrl,
  onError,
}: Props) {
  const tossRef = useRef<Awaited<ReturnType<typeof loadTossPayments>> | null>(null);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    loadTossPayments(TOSS_CLIENT_KEY)
      .then((tp) => {
        tossRef.current = tp;
      })
      .catch((err) => {
        console.error("Toss SDK load error:", err);
        onErrorRef.current?.("결제 모듈 로드에 실패했습니다");
      });
  }, []);

  async function handlePayment() {
    try {
      const toss = tossRef.current;
      if (!toss) {
        onError?.("결제 모듈이 준비되지 않았습니다. 페이지를 새로고침해주세요.");
        return;
      }

      const customerKey = customerEmail || `guest_${orderId}`;
      const payment = toss.payment({ customerKey });

      const resolvedSuccessUrl = successUrl || `${window.location.origin}/business/ads/new/success`;
      const resolvedFailUrl = failUrl || `${window.location.origin}/business/ads/new/fail`;

      if (method === "BANK_TRANSFER") {
        await payment.requestPayment({
          method: "VIRTUAL_ACCOUNT",
          amount: { currency: "KRW", value: amount },
          orderId,
          orderName,
          customerName: customerName || "고객",
          customerEmail: customerEmail || undefined,
          successUrl: resolvedSuccessUrl,
          failUrl: resolvedFailUrl,
          virtualAccount: {
            validHours: 48,
          },
        });
      } else if (method === "KAKAO_PAY") {
        await payment.requestPayment({
          method: "CARD",
          amount: { currency: "KRW", value: amount },
          orderId,
          orderName,
          customerName: customerName || "고객",
          customerEmail: customerEmail || undefined,
          successUrl: resolvedSuccessUrl,
          failUrl: resolvedFailUrl,
          card: {
            flowMode: "DIRECT",
            easyPay: "카카오페이",
          },
        });
      } else {
        await payment.requestPayment({
          method: "CARD",
          amount: { currency: "KRW", value: amount },
          orderId,
          orderName,
          customerName: customerName || "고객",
          customerEmail: customerEmail || undefined,
          successUrl: resolvedSuccessUrl,
          failUrl: resolvedFailUrl,
        });
      }
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
    <Button className="h-12 w-full text-base" onClick={handlePayment}>
      {method === "BANK_TRANSFER"
        ? `가상계좌 ${amount.toLocaleString()}원 발급`
        : method === "KAKAO_PAY"
          ? `카카오페이 ${amount.toLocaleString()}원 결제`
          : `카드 ${amount.toLocaleString()}원 결제`}
    </Button>
  );
}
