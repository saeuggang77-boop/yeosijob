"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { REGION_LIST } from "@/lib/constants/regions";
import {
  AD_PRODUCTS,
  AD_OPTIONS,
  type DurationDays,
} from "@/lib/constants/products";
import type { AdFormData } from "@/lib/validators/ad";

interface Props {
  data: Partial<AdFormData>;
  onUpdate: (data: Partial<AdFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

// Phase 2-16: 모든 등급 오픈 (FREE 추가)
const AVAILABLE_PRODUCTS = ["FREE", "LINE", "RECOMMEND", "URGENT", "SPECIAL", "PREMIUM", "VIP", "BANNER"] as const;
const DURATION_OPTIONS: { value: DurationDays; label: string }[] = [
  { value: 30, label: "30일" },
  { value: 60, label: "60일" },
  { value: 90, label: "90일" },
];

// Phase 2-19: ICON, HIGHLIGHT 값 선택 상수
const ICON_EMOJIS: Record<string, string> = {
  "1": "🔥", "2": "💎", "3": "⭐", "4": "🎯", "5": "💰",
  "6": "👑", "7": "🎀", "8": "✨", "9": "🌟", "10": "💜",
};

const HIGHLIGHT_COLORS: Record<string, { bg: string; label: string }> = {
  yellow: { bg: "bg-yellow-100", label: "노랑" },
  pink: { bg: "bg-pink-100", label: "분홍" },
  blue: { bg: "bg-blue-100", label: "파랑" },
  green: { bg: "bg-green-100", label: "초록" },
  purple: { bg: "bg-purple-100", label: "보라" },
  orange: { bg: "bg-orange-100", label: "주황" },
  red: { bg: "bg-red-100", label: "빨강" },
  cyan: { bg: "bg-cyan-100", label: "하늘" },
};

export function Step3ProductSelector({
  data,
  onUpdate,
  onNext,
  onBack,
}: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const productId = data.productId || "LINE";
  const durationDays = data.durationDays ?? 30;
  const isFreeProduct = productId === "FREE";
  const regions = data.regions || [];
  const options = data.options || [];
  const optionValues = data.optionValues || {};

  const product = AD_PRODUCTS[productId];

  const totalPrice = useMemo(() => {
    // FREE 상품은 0원
    if (productId === "FREE") {
      return 0;
    }

    let total = 0;
    const duration = durationDays as DurationDays;

    // 줄광고 필수
    total += AD_PRODUCTS.LINE.pricing[duration];

    // 상위 등급 (줄광고가 아닌 경우)
    if (productId !== "LINE") {
      total += AD_PRODUCTS[productId].pricing[duration];
    }

    // 부가 옵션
    for (const optId of options) {
      const opt = AD_OPTIONS[optId as keyof typeof AD_OPTIONS];
      if (opt) {
        const isFree = optId === "ICON" && AD_PRODUCTS[productId]?.includeIconFree;
        if (!isFree) {
          total += opt.pricing[duration];
        }
      }
    }

    return total;
  }, [productId, durationDays, options]);

  function toggleRegion(regionKey: string) {
    const maxRegions = product.maxRegions || 1;
    const current = [...regions];
    const idx = current.indexOf(regionKey);
    if (idx >= 0) {
      current.splice(idx, 1);
    } else if (current.length < maxRegions) {
      current.push(regionKey);
    }
    onUpdate({ regions: current });
  }

  function toggleOption(optionId: string) {
    const current = [...options];
    const idx = current.indexOf(optionId);
    if (idx >= 0) {
      current.splice(idx, 1);
      // Clear option value when deselected
      if (optionValues[optionId]) {
        const newValues = { ...optionValues };
        delete newValues[optionId];
        onUpdate({ options: current, optionValues: newValues });
        return;
      }
    } else {
      current.push(optionId);
    }
    onUpdate({ options: current });
  }

  function updateOptionValue(optId: string, value: string) {
    onUpdate({ optionValues: { ...optionValues, [optId]: value } });
  }

  function handleSubmit() {
    const errs: Record<string, string> = {};
    if (regions.length === 0) {
      errs.regions = "노출 지역을 선택해주세요";
    }
    if (options.includes("ICON") && !optionValues.ICON) {
      errs.icon = "아이콘을 선택해주세요";
    }
    if (options.includes("HIGHLIGHT") && !optionValues.HIGHLIGHT) {
      errs.highlight = "형광펜 색상을 선택해주세요";
    }
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    onNext();
  }

  return (
    <div className="space-y-4">
      {/* 기간 선택 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">광고 기간</CardTitle>
        </CardHeader>
        <CardContent>
          {isFreeProduct ? (
            <div className="rounded-md border border-muted bg-muted/30 p-4 text-center">
              <p className="text-lg font-semibold text-primary">무제한</p>
              <p className="mt-1 text-xs text-muted-foreground">무료 광고는 기간 제한이 없습니다</p>
            </div>
          ) : (
            <div className="flex gap-2">
              {DURATION_OPTIONS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => onUpdate({ durationDays: d.value })}
                  className={`flex-1 rounded-md border py-3 text-center text-sm font-medium transition-colors ${
                    durationDays === d.value
                      ? "border-primary bg-primary/5 text-primary"
                      : "hover:bg-muted"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 노출 지역 선택 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            노출 지역{" "}
            <span className="text-sm font-normal text-muted-foreground">
              (최대 {product.maxRegions || 1}개)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {REGION_LIST.map((r) => {
              const selected = regions.includes(r.value);
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => toggleRegion(r.value)}
                  className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
          {errors.regions && (
            <p className="mt-2 text-xs text-destructive">{errors.regions}</p>
          )}
        </CardContent>
      </Card>

      {/* 상품 선택 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">광고 상품</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {AVAILABLE_PRODUCTS.map((pid) => {
            const p = AD_PRODUCTS[pid];
            const isLine = pid === "LINE";
            const isFree = pid === "FREE";
            const isUpgradeSelected = !isLine && !isFree && productId === pid;
            const isFreeSelected = isFree && productId === "FREE";

            return (
              <div key={pid}>
                <button
                  type="button"
                  onClick={() => {
                    if (isLine && productId !== "FREE") return;
                    if (isFree) {
                      onUpdate({
                        productId: "FREE",
                        durationDays: 0,
                        regions: regions.length > 1 ? regions.slice(0, 1) : regions,
                        options: [],
                        optionValues: {},
                      });
                    } else if (isUpgradeSelected) {
                      // 해제: 줄광고만으로 되돌리기
                      const lineMax = AD_PRODUCTS.LINE.maxRegions;
                      onUpdate({
                        productId: "LINE",
                        durationDays: isFreeProduct ? 30 : durationDays,
                        regions: regions.length > lineMax ? regions.slice(0, lineMax) : regions,
                      });
                    } else if (!isFree) {
                      // 선택: 상위 등급으로 변경
                      onUpdate({
                        productId: pid,
                        durationDays: isFreeProduct ? 30 : durationDays,
                        regions: regions.length > p.maxRegions ? regions.slice(0, p.maxRegions) : regions,
                      });
                    }
                  }}
                  className={`flex w-full items-center justify-between rounded-lg border p-4 text-left transition-colors ${
                    isUpgradeSelected || isFreeSelected
                      ? "border-primary bg-primary/5"
                      : isLine
                        ? "border-muted bg-muted/30"
                        : "hover:bg-muted/50"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{p.name}</span>
                      {isLine && !isFreeSelected && (
                        <Badge variant="secondary" className="text-[10px]">
                          필수
                        </Badge>
                      )}
                      {(isUpgradeSelected || isFreeSelected) && (
                        <Badge className="text-[10px]">선택됨 {!isFree && "(다시 눌러 해제)"}</Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {isFree ? "0원 · 기간무제한 · 기본 노출만" : p.description}
                    </p>
                    {!isFree && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        자동점프 일{p.autoJumpPerDay}회
                        {p.manualJumpPerDay > 0 &&
                          ` · 수동점프 일${p.manualJumpPerDay}회`}
                        {` · 지역 ${p.maxRegions}개`}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {isFree
                        ? "무료"
                        : isLine
                          ? `${p.pricing[durationDays as DurationDays].toLocaleString()}원`
                          : `+${p.pricing[durationDays as DurationDays].toLocaleString()}원`}
                    </p>
                    {!isFree && (
                      <p className="text-xs text-muted-foreground">
                        {durationDays}일
                      </p>
                    )}
                  </div>
                </button>
                {isFreeSelected && (
                  <div className="mt-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700">
                    유료 등급으로 업그레이드하면 자동점프, 이력서 열람 등 더 많은 기능을 사용할 수 있습니다
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* 부가 옵션 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            부가 옵션{" "}
            <span className="text-sm font-normal text-muted-foreground">
              (선택)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isFreeProduct ? (
            <div className="rounded-md border border-muted bg-muted/30 p-4 text-center text-sm text-muted-foreground">
              부가옵션은 유료 등급에서 사용할 수 있습니다
            </div>
          ) : (
            <>
          {Object.entries(AD_OPTIONS).map(([optId, opt]) => {
            // 급구 등급이면 아이콘 무료
            const isFreeIcon =
              optId === "ICON" && AD_PRODUCTS[productId]?.includeIconFree;
            const isSelected = options.includes(optId);
            const price = isFreeIcon ? 0 : opt.pricing[durationDays as DurationDays];

            return (
              <div key={optId}>
                <button
                  type="button"
                  onClick={() => toggleOption(optId)}
                  className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors ${
                    isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{opt.name}</span>
                      {isFreeIcon && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] bg-green-100 text-green-700"
                        >
                          무료
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {opt.description}
                    </p>
                  </div>
                  <div className="text-right">
                    {isFreeIcon ? (
                      <p className="font-medium text-green-600">무료</p>
                    ) : (
                      <p className="font-medium">
                        +{price.toLocaleString()}원
                      </p>
                    )}
                  </div>
                </button>

                {/* ICON value selector */}
                {isSelected && optId === "ICON" && (
                  <div className="mt-2 grid grid-cols-5 gap-2 rounded-lg border bg-muted/30 p-3">
                    {Object.entries(ICON_EMOJIS).map(([val, emoji]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => updateOptionValue("ICON", val)}
                        className={`flex h-10 w-full items-center justify-center rounded-md border text-lg transition-colors ${
                          optionValues.ICON === val
                            ? "border-primary bg-primary/10"
                            : "hover:bg-muted"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
                {isSelected && optId === "ICON" && errors.icon && (
                  <p className="mt-1 text-xs text-destructive">{errors.icon}</p>
                )}

                {/* HIGHLIGHT value selector */}
                {isSelected && optId === "HIGHLIGHT" && (
                  <div className="mt-2 grid grid-cols-4 gap-2 rounded-lg border bg-muted/30 p-3">
                    {Object.entries(HIGHLIGHT_COLORS).map(([val, { bg, label }]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => updateOptionValue("HIGHLIGHT", val)}
                        className={`flex h-10 w-full items-center justify-center rounded-md border text-xs font-medium transition-colors ${bg} ${
                          optionValues.HIGHLIGHT === val
                            ? "ring-2 ring-primary"
                            : "hover:opacity-80"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
                {isSelected && optId === "HIGHLIGHT" && errors.highlight && (
                  <p className="mt-1 text-xs text-destructive">{errors.highlight}</p>
                )}
              </div>
            );
          })}
            </>
          )}
        </CardContent>
      </Card>

      {/* 합산 금액 고정 바 */}
      <div className="sticky bottom-[68px] md:bottom-0 rounded-lg border bg-background p-4 shadow-lg">
        <div className="space-y-1 text-sm">
          {isFreeProduct ? (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">무료 광고</span>
                <span className="font-semibold text-green-600">무료</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between text-base font-bold">
                <span>총 결제금액</span>
                <span className="text-primary">무료</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">줄광고 ({durationDays}일)</span>
                <span>{AD_PRODUCTS.LINE.pricing[durationDays as DurationDays].toLocaleString()}원</span>
              </div>
              {productId !== "LINE" && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {AD_PRODUCTS[productId].name} ({durationDays}일)
                  </span>
                  <span>
                    {AD_PRODUCTS[productId].pricing[durationDays as DurationDays].toLocaleString()}원
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
                    <span className="text-muted-foreground">{opt.name}</span>
                    <span>
                      {isFree ? "무료" : `${opt.pricing[durationDays as DurationDays].toLocaleString()}원`}
                    </span>
                  </div>
                );
              })}
              <Separator className="my-2" />
              <div className="flex justify-between text-base font-bold">
                <span>총 결제금액</span>
                <span className="text-primary">
                  {totalPrice.toLocaleString()}원
                </span>
              </div>
              <p className="text-xs text-muted-foreground">VAT 포함</p>
            </>
          )}
        </div>

        <div className="mt-3 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onBack}>
            이전
          </Button>
          <Button className="flex-1" onClick={handleSubmit}>
            다음 단계
          </Button>
        </div>
      </div>
    </div>
  );
}
