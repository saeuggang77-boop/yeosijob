"use client";

import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { BANK_NAME, ACCOUNT_NUMBER, ACCOUNT_HOLDER } from "@/lib/constants/bank-account";

export default function PartnerPaymentSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const depositorCode = orderId ? orderId.slice(-4).toUpperCase() : "";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">결제 신청 완료</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-blue-500" />
            <h2 className="mt-4 text-xl font-bold">입금 안내</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              아래 계좌로 입금해주시면 확인 후 서비스가 활성화됩니다
            </p>
          </div>

          <div className="rounded-lg bg-muted p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">은행</span>
              <span className="font-medium">{BANK_NAME}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">계좌번호</span>
              <span className="font-mono font-bold">{ACCOUNT_NUMBER}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">예금주</span>
              <span className="font-medium">{ACCOUNT_HOLDER}</span>
            </div>
            {depositorCode && (
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">입금자명</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {depositorCode}
                </span>
              </div>
            )}
          </div>

          <div className="mt-4 rounded-lg bg-amber-500/10 p-3 text-sm text-amber-600 dark:text-amber-400">
            입금 확인 후 서비스가 활성화됩니다 (영업시간 내 최대 1시간).
            입금자명을 반드시 위에 안내된 이름으로 기재해주세요.
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/business/partner">
              <Button variant="outline">제휴업체 관리</Button>
            </Link>
            <Link href="/">
              <Button>홈으로</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
