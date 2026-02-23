"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function GrantCreditsButton({ userId }: { userId: string }) {
  const router = useRouter();
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/users/${userId}/credits`)
      .then((res) => res.json())
      .then((data) => setCredits(data.freeAdCredits ?? 0))
      .catch(() => setCredits(0));
  }, [userId]);

  async function handleClick() {
    const action = prompt(
      `무료 광고권 관리 (현재: ${credits ?? 0}회)\n\n` +
      `1) 추가 — 현재 보유량에 더함\n` +
      `2) 설정 — 특정 수량으로 변경 (0 입력 시 초기화)\n\n` +
      `번호를 입력하세요 (1 또는 2):`
    );
    if (!action || (action !== "1" && action !== "2")) return;

    const isSet = action === "2";
    const input = prompt(
      isSet
        ? `변경할 광고권 수량을 입력하세요 (0~100):`
        : `추가할 광고권 수량을 입력하세요 (1~100):`
    );
    if (!input) return;

    const amount = parseInt(input, 10);
    if (isNaN(amount)) {
      alert("숫자를 입력해주세요");
      return;
    }
    if (isSet && (amount < 0 || amount > 100)) {
      alert("0~100 사이의 숫자를 입력해주세요");
      return;
    }
    if (!isSet && (amount < 1 || amount > 100)) {
      alert("1~100 사이의 숫자를 입력해주세요");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/credits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isSet ? { credits: amount, mode: "set" } : { credits: amount }),
      });
      const data = await res.json();
      if (res.ok) {
        setCredits(data.freeAdCredits);
        alert(data.message);
        router.refresh();
      } else {
        alert(data.error || "처리 실패");
      }
    } catch {
      alert("서버 오류");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button size="sm" variant="outline" onClick={handleClick} disabled={loading}>
      {credits === null ? "..." : credits > 0 ? `광고권 ${credits}` : "광고권"}
    </Button>
  );
}
