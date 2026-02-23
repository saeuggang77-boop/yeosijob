"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Step1BusinessInfo } from "@/components/ads/steps/Step1BusinessInfo";
import { Step2JobInfo } from "@/components/ads/steps/Step2JobInfo";
import { Step3ProductSelector } from "@/components/ads/steps/Step3ProductSelector";
import { Step4Payment } from "@/components/ads/steps/Step4Payment";
import { TossPaymentWidget } from "@/components/payment/TossPaymentWidget";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { AdFormData } from "@/lib/validators/ad";

const STEP_LABELS = ["업소 정보", "채용 정보", "상품 선택", "결제"];

export default function NewAdPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<AdFormData>>({
    regions: [],
    durationDays: 30,
    productId: "LINE",
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

  function updateData(data: Partial<AdFormData>) {
    setFormData((prev) => ({ ...prev, ...data }));
  }

  function handleNext() {
    setStep((s) => Math.min(s + 1, 4));
  }

  function handleBack() {
    setStep((s) => Math.max(s - 1, 1));
  }

  async function handleSubmit(paymentMethod: "CARD" | "KAKAO_PAY" | "BANK_TRANSFER") {
    setError("");
    setLoading(true);
    try {
      const isFreeProduct = formData.productId === "FREE";

      const res = await fetch("/api/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          paymentMethod: isFreeProduct ? undefined : paymentMethod
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "광고 등록에 실패했습니다");
        return;
      }

      // FREE 상품: 바로 대시보드로 이동
      if (isFreeProduct) {
        router.push("/business/dashboard");
        return;
      }

      // 무통장 입금: 기존 결제 안내 페이지로 이동
      if (paymentMethod === "BANK_TRANSFER") {
        router.push(`/business/ads/${result.adId}/payment?orderId=${result.orderId}`);
      } else {
        // 카드/카카오페이: 결제 위젯 표시
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

  // 결제 위젯 화면
  if (showPayment && paymentInfo) {
    return (
      <div className="mx-auto max-w-screen-md px-4 py-6">
        <h1 className="text-2xl font-bold">결제</h1>
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
            customerName={formData.businessName || ""}
            customerEmail={session?.user?.email || ""}
            method={paymentInfo.method}
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

  return (
    <div className="mx-auto max-w-screen-md px-4 py-6">
      <h1 className="text-2xl font-bold">광고 등록</h1>

      {/* 스텝 인디케이터 */}
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
                  <div
                    className={`h-0.5 flex-1 ${
                      isDone ? "bg-primary/40" : "bg-muted"
                    }`}
                  />
                )}
              </div>
              <span
                className={`mt-1 text-xs ${
                  isActive ? "font-medium" : "text-muted-foreground"
                }`}
              >
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

      {/* 스텝 컨텐츠 */}
      <div className="mt-6">
        {step === 1 && (
          <Step1BusinessInfo
            data={formData}
            onUpdate={updateData}
            onNext={handleNext}
          />
        )}
        {step === 2 && (
          <Step2JobInfo
            data={formData}
            onUpdate={updateData}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {step === 3 && (
          <Step3ProductSelector
            data={formData}
            onUpdate={updateData}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {step === 4 && (
          <Step4Payment
            data={formData}
            onBack={handleBack}
            onSubmit={handleSubmit}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
}
