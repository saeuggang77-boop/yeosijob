"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  AD_PRODUCTS,
  AD_OPTIONS,
  type DurationDays,
} from "@/lib/constants/products";
import { REGIONS } from "@/lib/constants/regions";
import { BUSINESS_TYPES } from "@/lib/constants/business-types";
import type { AdFormData } from "@/lib/validators/ad";

interface Props {
  data: Partial<AdFormData>;
  onBack: () => void;
  onSubmit: (paymentMethod: "CARD" | "KAKAO_PAY" | "BANK_TRANSFER") => void;
  loading: boolean;
}

export function Step4Payment({ data, onBack, onSubmit, loading }: Props) {
  const [selectedMethod, setSelectedMethod] = useState<"CARD" | "KAKAO_PAY" | "BANK_TRANSFER">("CARD");

  const productId = data.productId || "LINE";
  const durationDays = data.durationDays ?? 30;
  const options = data.options || [];
  const product = AD_PRODUCTS[productId];
  const isFreeProduct = productId === "FREE";

  // 합산 계산
  let totalPrice = 0;
  if (!isFreeProduct) {
    const duration = durationDays as DurationDays;
    totalPrice = AD_PRODUCTS.LINE.pricing[duration];
    if (productId !== "LINE") {
      totalPrice += AD_PRODUCTS[productId].pricing[duration];
    }
    for (const optId of options) {
      const opt = AD_OPTIONS[optId as keyof typeof AD_OPTIONS];
      if (opt) {
        const isFree =
          optId === "ICON" && AD_PRODUCTS[productId]?.includeIconFree;
        if (!isFree) {
          totalPrice += opt.pricing[duration];
        }
      }
    }
  }

  const regionLabels = (data.regions || [])
    .map((r) => REGIONS[r as keyof typeof REGIONS]?.label || r)
    .join(", ");
  const bizLabel =
    BUSINESS_TYPES[data.businessType as keyof typeof BUSINESS_TYPES]?.label ||
    data.businessType;

  return (
    <div className="space-y-4">
      {/* 광고 정보 요약 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">광고 정보 확인</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">업소명</span>
            <span className="font-medium">{data.businessName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">업종</span>
            <span>{bizLabel}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">채용 제목</span>
            <span className="font-medium">{data.title}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">급여</span>
            <span>{data.salaryText}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">노출 지역</span>
            <span>{regionLabels}</span>
          </div>
        </CardContent>
      </Card>

      {/* 상품 요약 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">결제 내역</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {isFreeProduct ? (
            <>
              <div className="flex justify-between">
                <span>무료 광고</span>
                <span className="font-semibold text-green-600">무료</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>기간</span>
                <span>무제한</span>
              </div>
              <Separator />
              <div className="flex justify-between text-base font-bold">
                <span>총 결제금액</span>
                <span className="text-primary">무료</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between">
                <div className="flex items-center gap-2">
                  <span>줄광고</span>
                  <Badge variant="secondary" className="text-[10px]">
                    필수
                  </Badge>
                </div>
                <span>
                  {AD_PRODUCTS.LINE.pricing[durationDays as DurationDays].toLocaleString()}원
                </span>
              </div>
              {productId !== "LINE" && (
                <div className="flex justify-between">
                  <span>{product.name}</span>
                  <span>
                    {product.pricing[durationDays as DurationDays].toLocaleString()}원
                  </span>
                </div>
              )}
              {options.map((optId) => {
                const opt = AD_OPTIONS[optId as keyof typeof AD_OPTIONS];
                if (!opt) return null;
                const isFree =
                  optId === "ICON" && AD_PRODUCTS[productId]?.includeIconFree;
                return (
                  <div key={optId} className="flex justify-between">
                    <span>{opt.name}</span>
                    <span>
                      {isFree
                        ? "무료"
                        : `${opt.pricing[durationDays as DurationDays].toLocaleString()}원`}
                    </span>
                  </div>
                );
              })}
              <div className="flex justify-between text-muted-foreground">
                <span>기간</span>
                <span>{durationDays}일</span>
              </div>
              <Separator />
              <div className="flex justify-between text-base font-bold">
                <span>총 결제금액</span>
                <span className="text-primary">
                  {totalPrice.toLocaleString()}원
                </span>
              </div>
              <p className="text-xs text-muted-foreground">VAT 포함</p>
            </>
          )}
        </CardContent>
      </Card>

      {/* 결제 수단 - FREE일 때는 숨김 */}
      {!isFreeProduct && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">결제 수단</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* 카드결제 */}
            <button
              type="button"
              onClick={() => setSelectedMethod("CARD")}
              className={`w-full rounded-lg border p-4 text-left transition-all ${
                selectedMethod === "CARD"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <p className="font-medium">카드결제</p>
              <p className="mt-1 text-sm text-muted-foreground">
                신용/체크카드로 즉시 결제
              </p>
            </button>

            {/* 카카오페이 */}
            <button
              type="button"
              onClick={() => setSelectedMethod("KAKAO_PAY")}
              className={`w-full rounded-lg border p-4 text-left transition-all ${
                selectedMethod === "KAKAO_PAY"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <p className="font-medium">카카오페이</p>
              <p className="mt-1 text-sm text-muted-foreground">
                카카오페이로 간편 결제
              </p>
            </button>

            {/* 무통장 입금 */}
            <button
              type="button"
              onClick={() => setSelectedMethod("BANK_TRANSFER")}
              className={`w-full rounded-lg border p-4 text-left transition-all ${
                selectedMethod === "BANK_TRANSFER"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <p className="font-medium">무통장 입금</p>
              <p className="mt-1 text-sm text-muted-foreground">
                주문 완료 후 입금 안내 확인 / 48시간 이내 미입금 시 자동 취소
              </p>
            </button>
          </CardContent>
        </Card>
      )}

      {/* FREE 전용 안내 카드 */}
      {isFreeProduct && (
        <Card>
          <CardContent className="py-6 text-center">
            <p className="text-lg font-semibold text-green-600">무료 광고를 등록합니다</p>
            <p className="mt-2 text-sm text-muted-foreground">
              결제 없이 바로 광고가 등록됩니다
            </p>
          </CardContent>
        </Card>
      )}

      {/* 약관 동의 및 결제 */}
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">
          결제를 진행하면 이용약관 및 개인정보처리방침에 동의하는 것으로
          간주합니다.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onBack}>
            이전
          </Button>
          <Button
            className="flex-1"
            onClick={() => onSubmit(isFreeProduct ? "CARD" : selectedMethod)}
            disabled={loading}
          >
            {loading
              ? "처리 중..."
              : isFreeProduct
                ? "무료 광고 등록하기"
                : selectedMethod === "BANK_TRANSFER"
                  ? `${totalPrice.toLocaleString()}원 주문하기`
                  : `${totalPrice.toLocaleString()}원 결제하기`}
          </Button>
        </div>
      </div>
    </div>
  );
}
