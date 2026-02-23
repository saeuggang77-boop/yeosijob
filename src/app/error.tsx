"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="text-gradient-gold text-8xl font-bold">500</p>
      <h1 className="mt-4 text-2xl font-bold">오류가 발생했습니다</h1>
      <p className="mt-2 text-muted-foreground">
        일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.
      </p>
      <div className="mt-8 flex gap-3">
        <Button onClick={reset}>다시 시도</Button>
        <Link href="/">
          <Button variant="outline">홈으로 이동</Button>
        </Link>
      </div>
    </div>
  );
}
