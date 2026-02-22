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
  method: "CARD" | "KAKAO_PAY";
  onError?: (message: string) => void;
}

export function TossPaymentWidget({
  orderId,
  orderName,
  amount,
  customerName,
  customerEmail,
  method,
  onError,
}: Props) {
  const tossRef = useRef<Awaited<ReturnType<typeof loadTossPayments>> | null>(null);

  useEffect(() => {
    loadTossPayments(TOSS_CLIENT_KEY)
      .then((tp) => {
        tossRef.current = tp;
      })
      .catch((err) => {
        console.error("Toss SDK load error:", err);
        onError?.("결제 모듈 로드에 실패했습니다");
      });
  }, [onError]);

  async function handlePayment() {
    const toss = tossRef.current;
    if (!toss) {
      onError?.("결제 모듈이 준비되지 않았습니다");
      return;
    }

    const payment = toss.payment({ customerKey: customerEmail });

    const successUrl = `${window.location.origin}/ads/new/success`;
    const failUrl = `${window.location.origin}/ads/new/fail`;

    try {
      if (method === "KAKAO_PAY") {
        await payment.requestPayment({
          method: "CARD",
          amount: { currency: "KRW", value: amount },
          orderId,
          orderName,
          customerName,
          customerEmail,
          successUrl,
          failUrl,
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
          customerName,
          customerEmail,
          successUrl,
          failUrl,
        });
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("USER_CANCEL")) return;
        onError?.(error.message);
      }
    }
  }

  return (
    <Button className="h-12 w-full text-base" onClick={handlePayment}>
      {method === "KAKAO_PAY"
        ? `카카오페이 ${amount.toLocaleString()}원 결제`
        : `카드 ${amount.toLocaleString()}원 결제`}
    </Button>
  );
}
