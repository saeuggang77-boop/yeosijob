"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Step1BusinessInfo } from "@/components/ads/steps/Step1BusinessInfo";
import { Step2JobInfo } from "@/components/ads/steps/Step2JobInfo";
import { Step3ProductSelector } from "@/components/ads/steps/Step3ProductSelector";
import { Step4Payment } from "@/components/ads/steps/Step4Payment";
import { TossPaymentWidget } from "@/components/payment/TossPaymentWidget";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { AdFormData } from "@/lib/validators/ad";

export default function NewAdPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [freeCredits, setFreeCredits] = useState(0);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<AdFormData>>({
    regions: [],
    durationDays: 0,
    productId: "",
    options: [],
    optionValues: {},
  });

  const isFreeProduct = formData.productId === "FREE";
  const STEP_LABELS = isFreeProduct
    ? ["업소 정보", "채용 정보", "상품 선택"]
    : ["업소 정보", "채용 정보", "상품 선택", "결제"];
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<{
    orderId: string;
    amount: number;
    orderName: string;
    method: "CARD" | "KAKAO_PAY";
  } | null>(null);

  useEffect(() => {
    fetch("/api/verification")
      .then((res) => res.json())
      .then((data) => {
        setIsVerified(data.isVerified ?? false);
        setFreeCredits(data.freeAdCredits ?? 0);
      })
      .catch(() => setIsVerified(false));
  }, []);

  // 비인증 업소 차단
  if (isVerified === false) {
    return (
      <div className="mx-auto max-w-screen-md px-4 py-6">
        <h1 className="text-2xl font-bold">광고 등록</h1>
        <Card className="mt-6 border-destructive/30">
          <CardHeader>
            <CardTitle className="text-destructive">사업자 인증 필요</CardTitle>
            <CardDescription>
              광고를 등록하려면 사업자 인증이 완료되어야 합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              프로필에서 사업자등록번호를 제출하고 관리자 승인을 받은 후 광고를 등록할 수 있습니다.
            </p>
            <Link href="/business/profile">
              <Button>프로필로 이동</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isVerified === null) {
    return (
      <div className="mx-auto max-w-screen-md px-4 py-6">
        <h1 className="text-2xl font-bold">광고 등록</h1>
        <p className="mt-6 text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  function updateData(data: Partial<AdFormData>) {
    setFormData((prev) => ({ ...prev, ...data }));
  }

  function handleNext() {
    const maxStep = formData.productId === "FREE" ? 3 : 4;
    setStep((s) => Math.min(s + 1, maxStep));
  }

  function handleBack() {
    setStep((s) => Math.max(s - 1, 1));
  }

  async function handleSubmit(paymentMethod?: "CARD" | "KAKAO_PAY" | "BANK_TRANSFER", useCreditFlag?: boolean) {
    setError("");
    setLoading(true);
    try {
      const isFreeProduct = formData.productId === "FREE";

      const payload = {
        ...formData,
        paymentMethod: isFreeProduct ? undefined : paymentMethod,
        useCredit: useCreditFlag || false,
      };

      const res = await fetch("/api/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "광고 등록에 실패했습니다");
        return;
      }

      // FREE 상품 또는 무료 광고권 사용: 성공 페이지로 이동
      if (isFreeProduct || result.useCredit) {
        router.push("/business/ads/new/success?free=true");
        return;
      }

      // 무통장 입금
      if (paymentMethod === "BANK_TRANSFER") {
        router.push(`/business/ads/${result.adId}/payment?orderId=${result.orderId}`);
      } else {
        // 카드/카카오페이
        setPaymentInfo({
          orderId: result.orderId,
          amount: result.amount,
          orderName: result.orderName,
          method: paymentMethod as "CARD" | "KAKAO_PAY",
        });
        setShowPayment(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "서버 오류가 발생했습니다");
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
            onFreeSubmit={() => handleSubmit()}
            freeSubmitLoading={loading}
            freeCredits={freeCredits}
            onCreditSubmit={() => handleSubmit(undefined, true)}
          />
        )}
        {step === 4 && formData.productId !== "FREE" && (
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
