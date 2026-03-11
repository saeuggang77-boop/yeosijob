"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

interface Props {
  params: Promise<{ token: string }>;
}

export default function PartnerPaymentSuccessPage({ params }: Props) {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [partnerId, setPartnerId] = useState<string | null>(null);

  useEffect(() => {
    const confirm = async () => {
      const paymentKey = searchParams.get("paymentKey");
      const orderId = searchParams.get("orderId");
      const amount = searchParams.get("amount");

      if (!paymentKey || !orderId || !amount) {
        setStatus("error");
        setMessage("결제 정보가 올바르지 않습니다");
        return;
      }

      const resolvedParams = await params;
      const token = resolvedParams.token;

      try {
        const res = await fetch(`/api/partners/pay/${token}/confirm`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentKey, orderId, amount: parseInt(amount) }),
        });

        const data = await res.json();

        if (res.ok) {
          setStatus("success");
          setMessage("결제가 완료되었습니다");
          setPartnerId(data.partnerId);
        } else {
          setStatus("error");
          setMessage(data.error || "결제 승인에 실패했습니다");
        }
      } catch (error) {
        console.error("Payment confirmation error:", error);
        setStatus("error");
        setMessage("결제 승인 중 오류가 발생했습니다");
      }
    };

    confirm();
  }, [searchParams, params]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">결제 결과</CardTitle>
        </CardHeader>
        <CardContent>
          {status === "loading" && (
            <div className="py-12 text-center">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground">결제를 승인하는 중입니다...</p>
            </div>
          )}

          {status === "success" && (
            <div className="py-12 text-center">
              <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
              <h2 className="mt-4 text-xl font-bold">{message}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                제휴업체로 등록되었습니다
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                {partnerId && (
                  <Link href={`/partner/${partnerId}`}>
                    <Button>업체 페이지 보기</Button>
                  </Link>
                )}
                <Link href="/partner">
                  <Button variant="outline">제휴업체 목록</Button>
                </Link>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="py-12 text-center">
              <XCircle className="mx-auto h-16 w-16 text-destructive" />
              <h2 className="mt-4 text-xl font-bold">결제 실패</h2>
              <p className="mt-2 text-sm text-muted-foreground">{message}</p>
              <div className="mt-6">
                <Link href="/partner">
                  <Button variant="outline">제휴업체 목록으로</Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
