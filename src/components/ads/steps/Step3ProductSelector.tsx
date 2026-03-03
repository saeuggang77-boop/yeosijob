"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
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
  onFreeSubmit?: () => void;
  freeSubmitLoading?: boolean;
  upgradeFrom?: string;
  freeCredits?: number;
  onCreditSubmit?: () => void;
  eventInfo?: { bonus30: number; bonus60: number; bonus90: number; eventName: string; endDate: string | null } | null;
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
  onFreeSubmit,
  freeSubmitLoading,
  upgradeFrom,
  freeCredits = 0,
  onCreditSubmit,
  eventInfo,
}: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const productId = data.productId || "";
  const durationDays = data.durationDays ?? 0;
  const isFreeProduct = productId === "FREE";
  const regions = data.regions || [];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const options = data.options || [];
  const optionValues = data.optionValues || {};

  const product = productId ? AD_PRODUCTS[productId] : AD_PRODUCTS.FREE;
  const isBanner = productId === "BANNER";

  const filteredProducts = upgradeFrom
    ? AVAILABLE_PRODUCTS.filter(pid => {
        if (pid === "FREE") return false;
        const currentRank = AD_PRODUCTS[upgradeFrom].rank;
        return AD_PRODUCTS[pid].rank < currentRank;
      })
    : AVAILABLE_PRODUCTS;

  const totalPrice = useMemo(() => {
    // FREE 상품은 0원
    if (productId === "FREE" || productId === "") return 0;
    if (durationDays === 0) return 0;

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
    } else if (maxRegions === 1) {
      // 1개 제한일 때 다른 지역 클릭 시 교체
      current[0] = regionKey;
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
    if (!isBanner && regions.length === 0) {
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
      {/* 1. 상품 선택 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">광고 상품</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredProducts.map((pid) => {
            const p = AD_PRODUCTS[pid];
            const isLine = pid === "LINE";
            const isFree = pid === "FREE";
            const isLineSelected = isLine && productId === "LINE";
            const isUpgradeSelected = !isLine && !isFree && productId === pid;
            const isFreeSelected = isFree && productId === "FREE";

            return (
              <div key={pid}>
                <button
                  type="button"
                  onClick={() => {
                    if (isLine) {
                      // 줄광고 선택 (어떤 상태에서든 줄광고로 전환)
                      onUpdate({
                        productId: "LINE",
                        durationDays: productId === "FREE" || productId === "" ? 0 : durationDays,
                        regions: regions.length > AD_PRODUCTS.LINE.maxRegions ? regions.slice(0, AD_PRODUCTS.LINE.maxRegions) : regions,
                        options: [],
                        optionValues: {},
                      });
                      return;
                    }
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
                        durationDays: isFreeProduct ? 0 : durationDays,
                        regions: regions.length > lineMax ? regions.slice(0, lineMax) : regions,
                      });
                    } else if (!isFree) {
                      // 선택: 상위 등급으로 변경
                      onUpdate({
                        productId: pid,
                        durationDays: isFreeProduct ? 0 : durationDays,
                        regions: regions.length > p.maxRegions ? regions.slice(0, p.maxRegions) : regions,
                      });
                    }
                  }}
                  className={`flex w-full items-center justify-between rounded-lg border p-4 text-left transition-colors ${
                    isUpgradeSelected || isFreeSelected || isLineSelected
                      ? "border-primary bg-primary/5"
                      : isLine && !isLineSelected && productId !== "" && productId !== "FREE"
                        ? "border-muted bg-muted/30"
                        : "hover:bg-muted/50"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{p.name}</span>
                      {isLineSelected && (
                        <Badge className="text-[10px]">선택됨</Badge>
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
                          ? `${p.pricing[(durationDays || 30) as DurationDays].toLocaleString()}원`
                          : `+${p.pricing[(durationDays || 30) as DurationDays].toLocaleString()}원`}
                    </p>
                    {!isFree && (
                      <p className="text-xs text-muted-foreground">
                        {durationDays > 0 ? `${durationDays}일` : "30일 기준"}
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

      {/* 3. 기간 선택 - 유료 상품 선택 후 표시 */}
      {!isFreeProduct && productId !== "" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">광고 기간</CardTitle>
          </CardHeader>
          <CardContent>
            {eventInfo && (
              <div className="mb-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
                <div className="flex items-center gap-2 font-semibold text-primary">
                  <span>🎉</span>
                  <span>{eventInfo.eventName}</span>
                </div>
                <p className="mt-1 text-muted-foreground">
                  지금 등록하면 보너스 기간을 드려요!
                </p>
              </div>
            )}
            <div className="flex gap-2">
              {DURATION_OPTIONS.map((d) => {
                const bonus = eventInfo
                  ? d.value === 30 ? eventInfo.bonus30
                    : d.value === 60 ? eventInfo.bonus60
                    : d.value === 90 ? eventInfo.bonus90
                    : 0
                  : 0;

                return (
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
                    <div className="text-center">
                      <div>
                        {bonus > 0 ? `${d.value}일 → ${d.value + bonus}일` : d.label}
                      </div>
                      {bonus > 0 && (
                        <div className="mt-0.5 text-[10px] text-primary font-semibold">
                          +{bonus}일 무료
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 4. 노출 지역 - 상품 선택 후 표시, BANNER는 전국 안내만 */}
      {productId !== "" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              노출 지역{" "}
              {!isBanner && (
                <span className="text-sm font-normal text-muted-foreground">
                  (최대 {product.maxRegions}개 선택 가능)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isBanner ? (
              <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
                노블레스는 전국 노출됩니다. 지역 선택이 필요하지 않습니다.
              </div>
            ) : (
              <>
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
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* 5. 부가 옵션 - 유료 + 기간 선택 완료 시만 */}
      {!isFreeProduct && productId !== "" && durationDays > 0 && (
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
          </CardContent>
        </Card>
      )}

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
          ) : productId === "" ? (
            <div className="py-2 text-center text-sm text-muted-foreground">
              상품을 선택해주세요
            </div>
          ) : durationDays === 0 ? (
            <div className="py-2 text-center text-sm text-muted-foreground">
              기간을 선택해주세요
            </div>
          ) : (
            <>
              {(() => {
                const bonus = eventInfo
                  ? durationDays === 30 ? eventInfo.bonus30
                    : durationDays === 60 ? eventInfo.bonus60
                    : durationDays === 90 ? eventInfo.bonus90
                    : 0
                  : 0;

                return (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      줄광고 ({durationDays}일{bonus > 0 ? ` + ${bonus}일` : ""})
                    </span>
                    <span>{AD_PRODUCTS.LINE.pricing[durationDays as DurationDays].toLocaleString()}원</span>
                  </div>
                );
              })()}
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
          {isFreeProduct ? (
            <Button
              className="flex-1"
              onClick={onFreeSubmit}
              disabled={regions.length === 0 || freeSubmitLoading}
            >
              {freeSubmitLoading ? "등록 중..." : "무료 광고 등록하기"}
            </Button>
          ) : (
            <>
              {freeCredits > 0 && productId !== "" && durationDays > 0 && (
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={onCreditSubmit}
                  disabled={(!isBanner && regions.length === 0) || freeSubmitLoading}
                >
                  {freeSubmitLoading ? "등록 중..." : `무료 광고권 사용 (${freeCredits}회)`}
                </Button>
              )}
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={productId === "" || (!isFreeProduct && durationDays === 0) || (!isBanner && regions.length === 0)}
              >
                결제하기
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
