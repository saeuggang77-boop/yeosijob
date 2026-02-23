"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Step3ProductSelector } from "@/components/ads/steps/Step3ProductSelector";
import { Step4Payment } from "@/components/ads/steps/Step4Payment";
import { TossPaymentWidget } from "@/components/payment/TossPaymentWidget";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AD_PRODUCTS } from "@/lib/constants/products";
import type { AdFormData } from "@/lib/validators/ad";

interface AdInfo {
  id: string;
  productId: string;
  businessName: string;
  regions: string[];
  title: string;
  status: string;
}

export default function UpgradeAdPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { data: session } = useSession();

  const [adInfo, setAdInfo] = useState<AdInfo | null>(null);
  const [loadingAd, setLoadingAd] = useState(true);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<AdFormData>>({
    regions: [],
    durationDays: 0,
    productId: "",
    options: [],
    optionValues: {},
  });
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
          // Pre-fill regions from current ad (trim to new product's maxRegions later)
          setFormData(prev => ({ ...prev, regions: data.regions || [] }));
        }
      })
      .catch(() => setError("광고 정보를 불러올 수 없습니다"))
      .finally(() => setLoadingAd(false));
  }, [id]);

  function updateData(data: Partial<AdFormData>) {
    setFormData(prev => ({ ...prev, ...data }));
  }

  async function handleSubmit(paymentMethod?: "CARD" | "KAKAO_PAY" | "BANK_TRANSFER") {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/ads/${id}/upgrade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          paymentMethod,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        setError(result.error || "업그레이드에 실패했습니다");
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

  // Toss payment widget screen
  if (showPayment && paymentInfo) {
    return (
      <div className="mx-auto max-w-screen-md px-4 py-6">
        <h1 className="text-2xl font-bold">업그레이드 결제</h1>
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
            successUrl={`${window.location.origin}/business/ads/new/success?upgrade=true`}
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

  const STEP_LABELS = ["상품 선택", "결제"];
  const currentProductName = AD_PRODUCTS[adInfo.productId]?.name || adInfo.productId;

  return (
    <div className="mx-auto max-w-screen-md px-4 py-6">
      <Link href={`/business/ads/${id}`}>
        <Button variant="ghost" size="sm" className="mb-2">
          <ArrowLeft className="w-4 h-4 mr-2" />
          광고 상세로 돌아가기
        </Button>
      </Link>
      <h1 className="text-2xl font-bold">광고 업그레이드</h1>

      {/* Current tier info */}
      <Card className="mt-4 border-muted">
        <CardHeader className="pb-2">
          <CardDescription>현재 등급</CardDescription>
          <CardTitle className="flex items-center gap-2">
            {currentProductName}
            <Badge variant="secondary">{adInfo.title}</Badge>
          </CardTitle>
        </CardHeader>
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
        {step === 1 && (
          <Step3ProductSelector
            data={formData}
            onUpdate={updateData}
            onNext={() => setStep(2)}
            onBack={() => router.push(`/business/ads/${id}`)}
            upgradeFrom={adInfo.productId}
          />
        )}
        {step === 2 && (
          <Step4Payment
            data={formData}
            onBack={() => setStep(1)}
            onSubmit={handleSubmit}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
}
