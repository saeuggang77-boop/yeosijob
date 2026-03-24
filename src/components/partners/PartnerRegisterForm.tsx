"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PARTNER_CATEGORIES, PARTNER_DURATION_OPTIONS, calculatePartnerPrice } from "@/lib/constants/partners";
import { toast } from "sonner";

export function PartnerRegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState<"select" | "receipt" | "done">("select");
  const [loading, setLoading] = useState(false);

  const [category, setCategory] = useState("");
  const [durationDays, setDurationDays] = useState(30);
  const [receiptType, setReceiptType] = useState<"NONE" | "TAX_INVOICE" | "CASH_RECEIPT">("NONE");
  const [taxEmail, setTaxEmail] = useState("");
  const [cashReceiptNo, setCashReceiptNo] = useState("");
  const [cashReceiptType, setCashReceiptType] = useState<"PHONE" | "BIZ">("PHONE");

  const [result, setResult] = useState<{
    orderId: string;
    amount: number;
    bankAccount: { bank: string; accountNumber: string; holder: string };
  } | null>(null);

  const categoryInfo = category ? PARTNER_CATEGORIES[category as keyof typeof PARTNER_CATEGORIES] : null;
  const price = category ? calculatePartnerPrice(category, durationDays) : 0;
  const baseMonthly = categoryInfo?.price || 0;
  const months = durationDays / 30;
  const totalBase = baseMonthly * months;
  const discountAmount = totalBase - price;

  const handleSubmit = async () => {
    if (!category) {
      toast.error("업종을 선택해주세요");
      return;
    }
    setLoading(true);

    try {
      const response = await fetch("/api/partners/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          durationDays,
          receiptType,
          taxEmail: receiptType === "TAX_INVOICE" ? taxEmail : undefined,
          cashReceiptNo: receiptType === "CASH_RECEIPT" ? cashReceiptNo : undefined,
          cashReceiptType: receiptType === "CASH_RECEIPT" ? cashReceiptType : undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "등록 실패");
      }

      setResult(data);
      setStep("done");
      toast.success("제휴업체 등록이 완료되었습니다");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "등록 중 오류가 발생했습니다";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // ── 완료 화면 ──
  if (step === "done" && result) {
    return (
      <Card className="border-green-500/30">
        <CardHeader>
          <CardTitle className="text-green-500">결제 신청 완료</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border border-green-500/20 bg-green-500/5 p-4 space-y-2">
            <p className="text-sm font-medium">아래 계좌로 입금해주세요</p>
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-muted-foreground">은행:</span>{" "}
                <span className="font-semibold">{result.bankAccount.bank}</span>
              </p>
              <p>
                <span className="text-muted-foreground">계좌번호:</span>{" "}
                <span className="font-mono font-semibold">{result.bankAccount.accountNumber}</span>
              </p>
              <p>
                <span className="text-muted-foreground">예금주:</span>{" "}
                <span className="font-semibold">{result.bankAccount.holder}</span>
              </p>
              <p>
                <span className="text-muted-foreground">입금액:</span>{" "}
                <span className="text-lg font-bold text-primary">{result.amount.toLocaleString()}원</span>
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            입금 확인 후 관리자가 승인하면 제휴업체가 활성화됩니다.
            <br />
            활성화 후 업체 정보를 입력하면 제휴업체 페이지에 노출됩니다.
          </p>
          <Button
            onClick={() => router.refresh()}
            variant="outline"
            className="w-full"
          >
            확인
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>제휴업체 등록</CardTitle>
        <p className="text-sm text-muted-foreground">
          업종과 기간을 선택하면 바로 결제를 진행할 수 있습니다
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 업종 선택 */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">업종 선택</Label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {Object.entries(PARTNER_CATEGORIES).map(([key, info]) => {
              const isSelected = category === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCategory(key)}
                  className={`flex items-center justify-between rounded-lg border p-3 text-left transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{info.emoji}</span>
                    <span className="font-medium">{info.label}</span>
                  </div>
                  <span className="text-sm font-semibold" style={{ color: info.color }}>
                    월 {info.price.toLocaleString()}원
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 기간 선택 */}
        {category && (
          <div className="space-y-3">
            <Label className="text-base font-semibold">기간 선택</Label>
            <div className="grid grid-cols-3 gap-2">
              {PARTNER_DURATION_OPTIONS.map((option) => {
                const isSelected = durationDays === option.days;
                const optionPrice = calculatePartnerPrice(category, option.days);
                return (
                  <button
                    key={option.days}
                    type="button"
                    onClick={() => setDurationDays(option.days)}
                    className={`rounded-lg border p-3 text-center transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <p className="text-sm font-semibold">{option.days}일</p>
                    <p className="mt-1 text-xs font-bold text-primary">
                      {optionPrice.toLocaleString()}원
                    </p>
                    {option.discount > 0 && (
                      <Badge variant="secondary" className="mt-1 text-[10px]">
                        {option.discount * 100}% 할인
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 가격 요약 */}
        {category && (
          <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {categoryInfo?.label} × {months}개월
              </span>
              <span>{totalBase.toLocaleString()}원</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-red-400">
                <span>장기 할인</span>
                <span>-{discountAmount.toLocaleString()}원</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2">
              <span className="font-semibold">결제 금액</span>
              <span className="text-lg font-bold text-primary">
                {price.toLocaleString()}원
              </span>
            </div>
          </div>
        )}

        {/* 증빙서류 (step === "select"에서 바로 표시) */}
        {category && step === "select" && (
          <div className="space-y-3">
            <Label className="text-base font-semibold">증빙서류</Label>
            <RadioGroup
              value={receiptType}
              onValueChange={(v) => setReceiptType(v as typeof receiptType)}
              className="space-y-2"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="NONE" id="receipt-none" />
                <Label htmlFor="receipt-none" className="cursor-pointer">발급 안함</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="TAX_INVOICE" id="receipt-tax" />
                <Label htmlFor="receipt-tax" className="cursor-pointer">세금계산서</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="CASH_RECEIPT" id="receipt-cash" />
                <Label htmlFor="receipt-cash" className="cursor-pointer">현금영수증</Label>
              </div>
            </RadioGroup>

            {receiptType === "TAX_INVOICE" && (
              <div>
                <Label htmlFor="taxEmail">세금계산서 수신 이메일</Label>
                <Input
                  id="taxEmail"
                  type="email"
                  value={taxEmail}
                  onChange={(e) => setTaxEmail(e.target.value)}
                  placeholder="tax@example.com"
                  required
                />
              </div>
            )}

            {receiptType === "CASH_RECEIPT" && (
              <div className="space-y-2">
                <Select
                  value={cashReceiptType}
                  onValueChange={(v) => setCashReceiptType(v as "PHONE" | "BIZ")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PHONE">휴대폰 번호</SelectItem>
                    <SelectItem value="BIZ">사업자등록번호</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={cashReceiptNo}
                  onChange={(e) => setCashReceiptNo(e.target.value.replace(/\D/g, ""))}
                  placeholder={cashReceiptType === "PHONE" ? "01012345678" : "1234567890"}
                  maxLength={13}
                />
              </div>
            )}
          </div>
        )}

        {/* 제출 버튼 */}
        {category && (
          <Button
            onClick={handleSubmit}
            disabled={loading || !category}
            className="w-full"
            size="lg"
          >
            {loading ? "처리 중..." : `${price.toLocaleString()}원 결제 신청`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
