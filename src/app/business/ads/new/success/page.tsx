"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface VirtualAccountInfo {
  bank: string;
  accountNumber: string;
  customerName: string;
  dueDate: string;
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const isFree = searchParams.get("free") === "true";
  const isUpgrade = searchParams.get("upgrade") === "true";
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    isFree ? "success" : "loading"
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [virtualAccountInfo, setVirtualAccountInfo] = useState<VirtualAccountInfo | null>(null);

  useEffect(() => {
    // FREE 광고는 결제 검증 불필요
    if (isFree) return;

    const paymentKey = searchParams.get("paymentKey");
    const orderId = searchParams.get("orderId");
    const amount = searchParams.get("amount");

    if (!paymentKey || !orderId || !amount) {
      queueMicrotask(() => {
        setStatus("error");
        setErrorMessage("결제 정보가 올바르지 않습니다");
      });
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
        if (data.virtualAccount) {
          setVirtualAccountInfo(data.virtualAccount);
        }
        setStatus("success");
      })
      .catch((err) => {
        setStatus("error");
        setErrorMessage(err.message);
      });
  }, [searchParams, isFree]);

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
          <Link href="/business/ads/new" className="flex-1">
            <Button variant="outline" className="w-full">
              다시 시도
            </Button>
          </Link>
          <Link href="/business/dashboard" className="flex-1">
            <Button className="w-full">광고 관리</Button>
          </Link>
        </div>
      </div>
    );
  }

  // 가상계좌 발급 완료 화면
  if (virtualAccountInfo) {
    const dueDate = new Date(virtualAccountInfo.dueDate);
    const dueDateStr = `${dueDate.getFullYear()}년 ${dueDate.getMonth() + 1}월 ${dueDate.getDate()}일 ${dueDate.getHours()}시 ${dueDate.getMinutes()}분`;

    return (
      <div className="mx-auto max-w-screen-sm px-4 py-8">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl text-blue-600">
            !
          </div>
          <h1 className="mt-4 text-2xl font-bold">가상계좌 발급 완료</h1>
          <p className="mt-2 text-muted-foreground">
            아래 계좌로 입금해주시면 자동으로 광고가 게재됩니다
          </p>
        </div>

        <Card className="mt-6">
          <CardContent className="py-6 space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">은행</span>
              <span className="font-medium">{virtualAccountInfo.bank}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">계좌번호</span>
              <span className="font-mono font-medium">{virtualAccountInfo.accountNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">예금주</span>
              <span className="font-medium">{virtualAccountInfo.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">입금 기한</span>
              <span className="font-medium text-destructive">{dueDateStr}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4 border-amber-500/30 bg-amber-500/5">
          <CardContent className="py-4">
            <p className="text-sm text-amber-600 dark:text-amber-400">
              입금 기한 내에 입금하지 않으면 주문이 자동 취소됩니다.
              입금 확인은 평균 1~2분 내에 자동으로 처리됩니다.
            </p>
          </CardContent>
        </Card>

        <div className="mt-6 flex gap-3">
          <Link href="/" className="flex-1">
            <Button variant="outline" className="w-full">
              홈으로
            </Button>
          </Link>
          <Link href="/business/dashboard" className="flex-1">
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
        <h1 className="mt-4 text-2xl font-bold">
          {isFree ? "광고 등록 완료" : isUpgrade ? "업그레이드 완료" : "결제 완료"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {isUpgrade ? "광고 등급이 업그레이드되었습니다" : "광고가 정상적으로 등록되었습니다"}
        </p>
      </div>

      <Card className="mt-6">
        <CardContent className="py-6 text-center">
          {isUpgrade ? (
            <>
              <p className="text-sm text-muted-foreground">
                업그레이드가 완료되어 새 등급이 즉시 적용됩니다.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                광고 관리 페이지에서 상태를 확인하세요.
              </p>
            </>
          ) : isFree ? (
            <>
              <p className="text-sm text-muted-foreground">
                무료 광고가 등록되어 즉시 게재됩니다.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                유료 등급으로 업그레이드하면 더 많은 노출과 기능을 이용할 수 있습니다.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                결제가 완료되어 광고가 즉시 게재됩니다.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                광고 관리 페이지에서 상태를 확인하세요.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 flex gap-3">
        <Link href="/" className="flex-1">
          <Button variant="outline" className="w-full">
            홈으로
          </Button>
        </Link>
        <Link href="/business/dashboard" className="flex-1">
          <Button className="w-full">광고 관리</Button>
        </Link>
      </div>
    </div>
  );
}
