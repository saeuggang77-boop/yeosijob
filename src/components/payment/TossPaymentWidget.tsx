"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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

type ReceiptType = "TAX_INVOICE" | "CASH_RECEIPT" | "NONE";
type CashReceiptType = "PHONE" | "BIZ";

const BANK_NAME = process.env.NEXT_PUBLIC_BANK_NAME || "토스뱅크";
const ACCOUNT_NUMBER = process.env.NEXT_PUBLIC_ACCOUNT_NUMBER || "";
const ACCOUNT_HOLDER = process.env.NEXT_PUBLIC_ACCOUNT_HOLDER || "여시잡";

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
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // 증빙서류 상태
  const [receiptType, setReceiptType] = useState<ReceiptType>("NONE");
  const [taxEmail, setTaxEmail] = useState(customerEmail || "");
  const [cashReceiptType, setCashReceiptType] = useState<CashReceiptType>("PHONE");
  const [cashReceiptNo, setCashReceiptNo] = useState("");

  // 고유 입금자명 (orderId 마지막 4자리)
  const depositorCode = orderId.slice(-4).toUpperCase();

  async function handleSubmit() {
    // 유효성 검사
    if (receiptType === "TAX_INVOICE" && !taxEmail.trim()) {
      onError?.("세금계산서 수신 이메일을 입력해주세요");
      return;
    }
    if (receiptType === "CASH_RECEIPT" && !cashReceiptNo.trim()) {
      onError?.("현금영수증 발급 번호를 입력해주세요");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/payments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          receiptType,
          ...(receiptType === "TAX_INVOICE" ? { taxEmail: taxEmail.trim() } : {}),
          ...(receiptType === "CASH_RECEIPT"
            ? {
                cashReceiptNo: cashReceiptNo.trim(),
                cashReceiptType,
              }
            : {}),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "결제 신청에 실패했습니다");
      }

      // 성공 시 successUrl로 이동
      const resolvedSuccessUrl =
        successUrl || `${window.location.origin}/business/ads/new/success`;
      const url = new URL(resolvedSuccessUrl);
      url.searchParams.set("orderId", orderId);
      router.push(url.toString());
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "결제 신청 중 오류가 발생했습니다";
      onError?.(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* 입금 계좌 안내 */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="py-5 space-y-3">
          <h3 className="text-center font-bold text-lg">입금 계좌 안내</h3>
          <div className="rounded-lg bg-background p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">은행</span>
              <span className="font-medium">{BANK_NAME}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">계좌번호</span>
              <span className="font-mono font-bold text-base">{ACCOUNT_NUMBER}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">예금주</span>
              <span className="font-medium">{ACCOUNT_HOLDER}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">입금액</span>
              <span className="font-bold text-primary text-lg">
                {amount.toLocaleString()}원
              </span>
            </div>
          </div>
          <div className="rounded-lg bg-amber-500/10 p-3 text-center">
            <p className="text-xs text-muted-foreground">입금자명</p>
            <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
              {depositorCode}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              입금 시 위 입금자명을 반드시 기재해주세요
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 증빙서류 선택 */}
      <Card>
        <CardContent className="py-5 space-y-4">
          <h3 className="font-semibold">증빙서류 선택</h3>
          <div className="space-y-2">
            {/* 미발행 */}
            <label
              className={`flex cursor-pointer items-center rounded-lg border p-3 transition-all ${
                receiptType === "NONE"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <input
                type="radio"
                name="receiptType"
                value="NONE"
                checked={receiptType === "NONE"}
                onChange={() => setReceiptType("NONE")}
                className="mr-3"
              />
              <span className="text-sm font-medium">미발행</span>
            </label>

            {/* 세금계산서 */}
            <label
              className={`flex cursor-pointer items-center rounded-lg border p-3 transition-all ${
                receiptType === "TAX_INVOICE"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <input
                type="radio"
                name="receiptType"
                value="TAX_INVOICE"
                checked={receiptType === "TAX_INVOICE"}
                onChange={() => setReceiptType("TAX_INVOICE")}
                className="mr-3"
              />
              <span className="text-sm font-medium">세금계산서</span>
            </label>
            {receiptType === "TAX_INVOICE" && (
              <div className="ml-7 space-y-2">
                <Input
                  type="email"
                  placeholder="세금계산서 수신 이메일"
                  value={taxEmail}
                  onChange={(e) => setTaxEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  입금 확인 후 이메일로 세금계산서가 발송됩니다
                </p>
              </div>
            )}

            {/* 현금영수증 */}
            <label
              className={`flex cursor-pointer items-center rounded-lg border p-3 transition-all ${
                receiptType === "CASH_RECEIPT"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <input
                type="radio"
                name="receiptType"
                value="CASH_RECEIPT"
                checked={receiptType === "CASH_RECEIPT"}
                onChange={() => setReceiptType("CASH_RECEIPT")}
                className="mr-3"
              />
              <span className="text-sm font-medium">현금영수증</span>
            </label>
            {receiptType === "CASH_RECEIPT" && (
              <div className="ml-7 space-y-3">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCashReceiptType("PHONE")}
                    className={`flex-1 rounded-md border px-3 py-2 text-sm transition-all ${
                      cashReceiptType === "PHONE"
                        ? "border-primary bg-primary/10 font-medium"
                        : "border-border"
                    }`}
                  >
                    휴대폰번호
                  </button>
                  <button
                    type="button"
                    onClick={() => setCashReceiptType("BIZ")}
                    className={`flex-1 rounded-md border px-3 py-2 text-sm transition-all ${
                      cashReceiptType === "BIZ"
                        ? "border-primary bg-primary/10 font-medium"
                        : "border-border"
                    }`}
                  >
                    사업자번호
                  </button>
                </div>
                <Input
                  type="text"
                  placeholder={
                    cashReceiptType === "PHONE"
                      ? "휴대폰 번호 (- 없이 입력)"
                      : "사업자 번호 (- 없이 입력)"
                  }
                  value={cashReceiptNo}
                  onChange={(e) => setCashReceiptNo(e.target.value)}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 안내 사항 */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="py-4">
          <ul className="list-inside list-disc space-y-1 text-sm text-amber-600 dark:text-amber-400">
            <li>입금 확인 후 광고가 게재됩니다 (영업시간 내 최대 1시간)</li>
            <li>입금자명을 반드시 위에 안내된 이름으로 기재해주세요</li>
            <li>입금 금액이 다를 경우 처리가 지연될 수 있습니다</li>
          </ul>
        </CardContent>
      </Card>

      {/* 결제 신청 버튼 */}
      <Button
        className="h-12 w-full text-base"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? "처리 중..." : `${amount.toLocaleString()}원 결제 신청하기`}
      </Button>
    </div>
  );
}
