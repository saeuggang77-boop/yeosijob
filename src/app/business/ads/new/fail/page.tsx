"use client";

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function PaymentFailPage() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const message = searchParams.get("message");

  return (
    <div className="mx-auto max-w-screen-sm px-4 py-8">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-2xl">
          ✕
        </div>
        <h1 className="mt-4 text-2xl font-bold">결제 실패</h1>
        <p className="mt-2 text-muted-foreground">
          {message || "결제 처리 중 오류가 발생했습니다"}
        </p>
        {code && (
          <p className="mt-1 text-xs text-muted-foreground">
            오류 코드: {code}
          </p>
        )}
      </div>

      <div className="mt-6 flex gap-3">
        <Link href="/business/ads/new" className="flex-1">
          <Button variant="outline" className="w-full">
            다시 시도
          </Button>
        </Link>
        <Link href="/business/dashboard" className="flex-1">
          <Button className="w-full">광고 관리</Button>
        </Link>
      </div>
    </div>
  );
}
