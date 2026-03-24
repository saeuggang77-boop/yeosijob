"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PARTNER_CATEGORIES, PARTNER_DURATION_OPTIONS, calculatePartnerPrice } from "@/lib/constants/partners";
import { toast } from "sonner";

export function PartnerRegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState("");
  const [durationDays, setDurationDays] = useState(30);

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
        body: JSON.stringify({ category, durationDays }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "등록 실패");
      }

      toast.success("업체 정보를 입력해주세요");
      router.push(`/business/partner/${data.partnerId}/edit`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "등록 중 오류가 발생했습니다";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>제휴업체 등록</CardTitle>
        <p className="text-sm text-muted-foreground">
          업종과 기간을 선택한 후, 업체 정보를 입력하고 결제를 진행합니다
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 업종 선택 */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">업종 선택</Label>
          <p className="text-xs text-muted-foreground">실제 업종과 다르게 선택할 경우 관리자 검토 후 승인이 거부될 수 있습니다</p>
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

        {/* 다음 단계 버튼 */}
        {category && (
          <Button
            onClick={handleSubmit}
            disabled={loading || !category}
            className="w-full"
            size="lg"
          >
            {loading ? "처리 중..." : "다음: 업체 정보 입력"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
