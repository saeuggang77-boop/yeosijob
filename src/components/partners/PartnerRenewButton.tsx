"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  partnerId: string;
  label?: string;
}

export function PartnerRenewButton({ partnerId, label = "연장 결제" }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleRenew = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/partners/${partnerId}/renew`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "연장 요청 실패");
      }

      router.push(`/partner/pay/${data.paymentToken}`);
    } catch (error: any) {
      toast.error(error.message || "오류가 발생했습니다");
      setLoading(false);
    }
  };

  return (
    <Button size="sm" onClick={handleRenew} disabled={loading}>
      {loading ? "처리 중..." : label}
    </Button>
  );
}
