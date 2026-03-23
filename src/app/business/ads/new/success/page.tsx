"use client";

import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BANK_NAME, ACCOUNT_NUMBER, ACCOUNT_HOLDER } from "@/lib/constants/bank-account";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const isFree = searchParams.get("free") === "true";
  const isUpgrade = searchParams.get("upgrade") === "true";
  const orderId = searchParams.get("orderId");

  // 무료 광고 또는 업그레이드 완료 (기존 로직 유지)
  if (isFree) {
    return (
      <div className="mx-auto max-w-screen-sm px-4 py-8">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-2xl text-green-600">
            ✓
          </div>
          <h1 className="mt-4 text-2xl font-bold">광고 등록 완료</h1>
          <p className="mt-2 text-muted-foreground">
            광고가 정상적으로 등록되었습니다
          </p>
        </div>

        <Card className="mt-6">
          <CardContent className="py-6 text-center">
            <p className="text-sm text-muted-foreground">
              무료 광고가 등록되어 즉시 게재됩니다.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              유료 등급으로 업그레이드하면 더 많은 노출과 기능을 이용할 수 있습니다.
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

  // 유료 결제 - 입금 안내 표시

  return (
    <div className="mx-auto max-w-screen-sm px-4 py-8">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl text-blue-600">
          !
        </div>
        <h1 className="mt-4 text-2xl font-bold">
          {isUpgrade ? "업그레이드 결제 신청 완료" : "결제 신청 완료"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          아래 계좌로 입금해주시면 확인 후 광고가 게재됩니다
        </p>
      </div>

      <Card className="mt-6">
        <CardContent className="py-6 space-y-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">은행</span>
            <span className="font-medium">{BANK_NAME}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">계좌번호</span>
            <span className="font-mono font-medium">{ACCOUNT_NUMBER}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">예금주</span>
            <span className="font-medium">{ACCOUNT_HOLDER}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4 border-amber-500/30 bg-amber-500/5">
        <CardContent className="py-4">
          <p className="text-sm text-amber-600 dark:text-amber-400">
            입금 확인 후 광고가 게재됩니다 (영업시간 내 최대 24시간).
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
