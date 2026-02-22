"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [adId, setAdId] = useState("");

  useEffect(() => {
    const paymentKey = searchParams.get("paymentKey");
    const orderId = searchParams.get("orderId");
    const amount = searchParams.get("amount");

    if (!paymentKey || !orderId || !amount) {
      setStatus("error");
      setErrorMessage("결제 정보가 올바르지 않습니다");
      return;
    }

    fetch("/api/payments/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount: Number(amount),
      }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "결제 승인 실패");
        }
        setAdId(data.adId);
        setStatus("success");
      })
      .catch((err) => {
        setStatus("error");
        setErrorMessage(err.message);
      });
  }, [searchParams]);

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-screen-sm px-4 py-20 text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-4 text-lg font-medium">결제를 확인하고 있습니다...</p>
        <p className="mt-1 text-sm text-muted-foreground">
          잠시만 기다려주세요
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="mx-auto max-w-screen-sm px-4 py-8">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-2xl">
            ✕
          </div>
          <h1 className="mt-4 text-2xl font-bold">결제 실패</h1>
          <p className="mt-2 text-muted-foreground">{errorMessage}</p>
        </div>
        <div className="mt-6 flex gap-3">
          <Link href="/ads/new" className="flex-1">
            <Button variant="outline" className="w-full">
              다시 시도
            </Button>
          </Link>
          <Link href="/dashboard" className="flex-1">
            <Button className="w-full">광고 관리</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-sm px-4 py-8">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-2xl text-green-600">
          ✓
        </div>
        <h1 className="mt-4 text-2xl font-bold">결제 완료</h1>
        <p className="mt-2 text-muted-foreground">
          광고가 정상적으로 등록되었습니다
        </p>
      </div>

      <Card className="mt-6">
        <CardContent className="py-6 text-center">
          <p className="text-sm text-muted-foreground">
            결제가 완료되어 광고가 즉시 게재됩니다.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            광고 관리 페이지에서 상태를 확인하세요.
          </p>
        </CardContent>
      </Card>

      <div className="mt-6 flex gap-3">
        <Link href="/" className="flex-1">
          <Button variant="outline" className="w-full">
            홈으로
          </Button>
        </Link>
        <Link href="/dashboard" className="flex-1">
          <Button className="w-full">광고 관리</Button>
        </Link>
      </div>
    </div>
  );
}
