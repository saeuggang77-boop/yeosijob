"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Props {
  businessNumber: string | null;
  isVerified: boolean;
  bizOwnerName?: string | null;
}

export function VerificationCard({ businessNumber, isVerified, bizOwnerName }: Props) {
  const router = useRouter();
  const [number, setNumber] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ verified: boolean; message: string } | null>(null);

  if (isVerified) {
    return (
      <Card>
        <CardContent className="flex items-center justify-between py-3">
          <div>
            <span className="text-sm">업소 인증</span>
            {bizOwnerName && <span className="text-xs text-muted-foreground ml-1">{bizOwnerName}</span>}
          </div>
          <Badge className="bg-green-100 text-green-700">인증완료</Badge>
        </CardContent>
      </Card>
    );
  }

  if (businessNumber) {
    return (
      <Card>
        <CardContent className="flex items-center justify-between py-3">
          <span className="text-sm">업소 인증</span>
          <Badge variant="secondary">검토 중</Badge>
        </CardContent>
      </Card>
    );
  }

  async function handleSubmit() {
    if (!number || number.replace(/-/g, "").length < 10) {
      alert("올바른 사업자등록번호를 입력해주세요");
      return;
    }
    if (!ownerName.trim()) {
      alert("대표자명을 입력해주세요");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessNumber: number, ownerName: ownerName.trim() }),
      });
      const data = await res.json();
      if (data.verified) {
        setResult({ verified: true, message: data.message });
        setTimeout(() => router.refresh(), 1500);
      } else if (res.ok) {
        setResult({ verified: false, message: data.message });
        setTimeout(() => router.refresh(), 2000);
      } else {
        setResult({ verified: false, message: data.message || data.error || "제출 실패" });
      }
    } catch {
      alert("서버 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="py-3">
        <p className="text-sm font-medium">업소 인증</p>
        <p className="mt-0.5 text-xs text-muted-foreground">사업자등록증에 기재된 정보를 입력해주세요</p>
        <div className="mt-2 space-y-2">
          <input
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="000-00-00000"
            className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            placeholder="대표자명"
            className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <Button size="sm" onClick={handleSubmit} disabled={loading} className="w-full">
            {loading ? "확인 중..." : "인증"}
          </Button>
        </div>
        {result && (
          <p className={`mt-2 text-xs ${result.verified ? "text-green-600" : "text-red-500"}`}>
            {result.message}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
