"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Step4Payment } from "@/components/ads/steps/Step4Payment";
import { TossPaymentWidget } from "@/components/payment/TossPaymentWidget";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AD_PRODUCTS, AD_OPTIONS, type DurationDays } from "@/lib/constants/products";

interface AdInfo {
  id: string;
  productId: string;
  businessName: string;
  regions: string[];
  title: string;
  status: string;
}

export default function RenewAdPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { data: session } = useSession();

  const [adInfo, setAdInfo] = useState<AdInfo | null>(null);
  const [loadingAd, setLoadingAd] = useState(true);
  const [step, setStep] = useState(1);
  const [durationDays, setDurationDays] = useState<DurationDays>(30);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [optionValues, setOptionValues] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<{
    orderId: string;
    amount: number;
    orderName: string;
    method: "CARD" | "KAKAO_PAY";
  } | null>(null);

  // Load current ad info
  useEffect(() => {
    fetch(`/api/ads/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setAdInfo(data);
        }
      })
      .catch(() => setError("광고 정보를 불러올 수 없습니다"))
      .finally(() => setLoadingAd(false));
  }, [id]);

  async function handleSubmit(paymentMethod?: "CARD" | "KAKAO_PAY" | "BANK_TRANSFER") {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/ads/${id}/renew`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          durationDays,
          options: selectedOptions,
          optionValues,
          paymentMethod,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        setError(result.error || "연장에 실패했습니다");
        return;
      }

      if (paymentMethod === "BANK_TRANSFER") {
        router.push(`/business/ads/${result.adId}/payment?orderId=${result.orderId}`);
      } else {
        setPaymentInfo({
          orderId: result.orderId,
          amount: result.amount,
          orderName: result.orderName,
          method: paymentMethod as "CARD" | "KAKAO_PAY",
        });
        setShowPayment(true);
      }
    } catch {
      setError("서버 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }

  if (loadingAd) {
    return (
      <div className="mx-auto max-w-screen-md px-4 py-20 text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-4 text-lg font-medium">광고 정보를 불러오는 중...</p>
      </div>
    );
  }

  if (!adInfo) {
    return (
      <div className="mx-auto max-w-screen-md px-4 py-8 text-center">
        <p className="text-destructive">{error || "광고를 찾을 수 없습니다"}</p>
        <Link href="/business/dashboard">
          <Button className="mt-4">대시보드로 이동</Button>
        </Link>
      </div>
    );
  }

  if (adInfo.status !== "EXPIRED") {
    return (
      <div className="mx-auto max-w-screen-md px-4 py-8 text-center">
        <p className="text-destructive">만료된 광고만 연장할 수 있습니다</p>
        <Link href={`/business/ads/${id}`}>
          <Button className="mt-4">광고 상세로 이동</Button>
        </Link>
      </div>
    );
  }

  if (adInfo.productId === "FREE") {
    return (
      <div className="mx-auto max-w-screen-md px-4 py-8 text-center">
        <p className="text-destructive">무료 광고는 연장이 필요하지 않습니다</p>
        <Link href={`/business/ads/${id}`}>
          <Button className="mt-4">광고 상세로 이동</Button>
        </Link>
      </div>
    );
  }

  // Toss payment widget screen
  if (showPayment && paymentInfo) {
    return (
      <div className="mx-auto max-w-screen-md px-4 py-6">
        <h1 className="text-2xl font-bold">광고 연장 결제</h1>
        <div className="mt-6 space-y-4">
          <Card>
            <CardContent className="py-6 text-center">
              <p className="text-lg font-bold">{paymentInfo.amount.toLocaleString()}원</p>
              <p className="text-sm text-muted-foreground">{paymentInfo.orderName}</p>
            </CardContent>
          </Card>
          <TossPaymentWidget
            orderId={paymentInfo.orderId}
            orderName={paymentInfo.orderName}
            amount={paymentInfo.amount}
            customerName={adInfo.businessName}
            customerEmail={session?.user?.email || ""}
            method={paymentInfo.method}
            successUrl={`${window.location.origin}/business/ads/new/success?renew=true`}
            failUrl={`${window.location.origin}/business/ads/new/fail`}
            onError={(msg) => {
              setError(msg);
              setShowPayment(false);
            }}
          />
          <Button variant="outline" className="w-full" onClick={() => setShowPayment(false)}>
            이전으로
          </Button>
        </div>
      </div>
    );
  }

  const product = AD_PRODUCTS[adInfo.productId];
  const currentProductName = product?.name || adInfo.productId;

  // 가격 계산
  const linePrice = AD_PRODUCTS.LINE.pricing[durationDays];
  let upgradePrice = 0;
  if (adInfo.productId !== "LINE") {
    upgradePrice = product.pricing[durationDays];
  }

  let optionsPrice = 0;
  for (const optId of selectedOptions) {
    const opt = AD_OPTIONS[optId as keyof typeof AD_OPTIONS];
    if (opt) {
      const isFree = optId === "ICON" && product?.includeIconFree;
      if (!isFree) {
        optionsPrice += opt.pricing[durationDays];
      }
    }
  }

  const totalPrice = linePrice + upgradePrice + optionsPrice;

  const STEP_LABELS = ["기간 선택", "부가 옵션", "결제"];

  return (
    <div className="mx-auto max-w-screen-md px-4 py-6">
      <Link href={`/business/ads/${id}`}>
        <Button variant="ghost" size="sm" className="mb-2">
          <ArrowLeft className="w-4 h-4 mr-2" />
          광고 상세로 돌아가기
        </Button>
      </Link>
      <h1 className="text-2xl font-bold">광고 연장</h1>

      {/* Current tier info */}
      <Card className="mt-4 border-muted">
        <CardHeader className="pb-2">
          <CardDescription>현재 등급</CardDescription>
          <CardTitle className="flex items-center gap-2">
            {currentProductName}
            <Badge variant="secondary">{adInfo.title}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            동일한 상품으로 광고 기간을 연장합니다
          </p>
        </CardContent>
      </Card>

      {/* Step indicator */}
      <div className="mt-6 flex items-center gap-1">
        {STEP_LABELS.map((label, i) => {
          const stepNum = i + 1;
          const isActive = stepNum === step;
          const isDone = stepNum < step;
          return (
            <div key={label} className="flex flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : isDone
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isDone ? "✓" : stepNum}
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div className={`h-0.5 flex-1 ${isDone ? "bg-primary/40" : "bg-muted"}`} />
                )}
              </div>
              <span className={`mt-1 text-xs ${isActive ? "font-medium" : "text-muted-foreground"}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="mt-6">
        {/* Step 1: Duration Selection */}
        {step === 1 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>연장 기간 선택</CardTitle>
                <CardDescription>광고를 연장할 기간을 선택하세요</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[30, 60, 90].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setDurationDays(days as DurationDays)}
                    className={`w-full rounded-lg border p-4 text-left transition-all ${
                      durationDays === days
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{days}일</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {product.name}: {product.pricing[days as DurationDays].toLocaleString()}원
                        </p>
                      </div>
                      {days === 90 && (
                        <Badge variant="secondary">추천</Badge>
                      )}
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => router.push(`/business/ads/${id}`)}>
                취소
              </Button>
              <Button className="flex-1" onClick={() => setStep(2)}>
                다음
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Options Selection */}
        {step === 2 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>부가 옵션 선택</CardTitle>
                <CardDescription>추가 기능을 선택하세요 (선택사항)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(AD_OPTIONS).map(([optId, opt]) => {
                  const isSelected = selectedOptions.includes(optId);
                  const isFree = optId === "ICON" && product?.includeIconFree;

                  return (
                    <button
                      key={optId}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedOptions(prev => prev.filter(id => id !== optId));
                        } else {
                          setSelectedOptions(prev => [...prev, optId]);
                        }
                      }}
                      className={`w-full rounded-lg border p-4 text-left transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{opt.name}</p>
                            {isFree && <Badge variant="secondary">무료</Badge>}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {opt.description}
                          </p>
                        </div>
                        <p className="ml-4 font-semibold">
                          {isFree ? "무료" : `${opt.pricing[durationDays].toLocaleString()}원`}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                이전
              </Button>
              <Button className="flex-1" onClick={() => setStep(3)}>
                다음
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Payment */}
        {step === 3 && (
          <div className="space-y-4">
            {/* 연장 정보 요약 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">연장 정보 확인</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">광고명</span>
                  <span className="font-medium">{adInfo.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">현재 상품</span>
                  <span className="font-medium">{currentProductName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">연장 기간</span>
                  <span>{durationDays}일</span>
                </div>
              </CardContent>
            </Card>

            {/* 결제 내역 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">결제 내역</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <div className="flex items-center gap-2">
                    <span>줄광고</span>
                    <Badge variant="secondary" className="text-[10px]">
                      필수
                    </Badge>
                  </div>
                  <span>{linePrice.toLocaleString()}원</span>
                </div>
                {adInfo.productId !== "LINE" && (
                  <div className="flex justify-between">
                    <span>{currentProductName}</span>
                    <span>{upgradePrice.toLocaleString()}원</span>
                  </div>
                )}
                {selectedOptions.map((optId) => {
                  const opt = AD_OPTIONS[optId as keyof typeof AD_OPTIONS];
                  if (!opt) return null;
                  const isFree = optId === "ICON" && product?.includeIconFree;
                  return (
                    <div key={optId} className="flex justify-between">
                      <span>{opt.name}</span>
                      <span>
                        {isFree ? "무료" : `${opt.pricing[durationDays].toLocaleString()}원`}
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
                  <span className="text-primary">{totalPrice.toLocaleString()}원</span>
                </div>
                <p className="text-xs text-muted-foreground">VAT 포함</p>
              </CardContent>
            </Card>

            {/* 결제 수단 */}
            <Step4Payment
              data={{
                businessName: adInfo.businessName,
                title: adInfo.title,
                regions: adInfo.regions,
                productId: adInfo.productId,
                durationDays,
                options: selectedOptions,
                optionValues,
              }}
              onBack={() => setStep(2)}
              onSubmit={handleSubmit}
              loading={loading}
            />
          </div>
        )}
      </div>
    </div>
  );
}
