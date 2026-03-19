"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function PaymentExportButton() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [type, setType] = useState<"TAX_INVOICE" | "CASH_RECEIPT" | "ALL">("ALL");
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        year: year.toString(),
        month: month.toString(),
        type,
      });
      const res = await fetch(`/api/admin/payments/export?${params}`);
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "다운로드에 실패했습니다");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const typeLabel = type === "TAX_INVOICE" ? "세금계산서" : type === "CASH_RECEIPT" ? "현금영수증" : "전체";
      a.download = `여시잡_${typeLabel}_${year}년${String(month).padStart(2, "0")}월.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert("다운로드 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  const selectClass =
    "h-9 rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-lg border bg-card p-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">증빙 유형</label>
        <select value={type} onChange={(e) => setType(e.target.value as typeof type)} className={selectClass}>
          <option value="TAX_INVOICE">세금계산서</option>
          <option value="CASH_RECEIPT">현금영수증</option>
          <option value="ALL">전체 승인 건</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">연도</label>
        <select value={year} onChange={(e) => setYear(Number(e.target.value))} className={selectClass}>
          {[now.getFullYear(), now.getFullYear() - 1].map((y) => (
            <option key={y} value={y}>{y}년</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">월</label>
        <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className={selectClass}>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>{m}월</option>
          ))}
        </select>
      </div>
      <Button onClick={handleDownload} disabled={loading} size="sm" className="h-9">
        {loading ? "생성 중..." : "엑셀 다운로드"}
      </Button>
    </div>
  );
}
