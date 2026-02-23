"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function PaymentFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState(searchParams.get("status") || "ALL");
  const [method, setMethod] = useState(searchParams.get("method") || "ALL");
  const [period, setPeriod] = useState(searchParams.get("period") || "ALL");
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (status !== "ALL") params.set("status", status);
    if (method !== "ALL") params.set("method", method);
    if (period !== "ALL") params.set("period", period);
    if (debouncedSearch) params.set("search", debouncedSearch);

    router.push(`/admin/payments?${params.toString()}`);
  }, [status, method, period, debouncedSearch, router]);

  const handleReset = () => {
    setStatus("ALL");
    setMethod("ALL");
    setPeriod("ALL");
    setSearch("");
    setDebouncedSearch("");
    router.push("/admin/payments");
  };

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Status Filter */}
        <div>
          <label className="mb-1.5 block text-sm font-medium">상태</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="ALL">전체</option>
            <option value="PENDING">입금대기</option>
            <option value="APPROVED">승인</option>
            <option value="FAILED">실패</option>
            <option value="CANCELLED">취소</option>
            <option value="REFUNDED">환불</option>
          </select>
        </div>

        {/* Payment Method Filter */}
        <div>
          <label className="mb-1.5 block text-sm font-medium">결제수단</label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="ALL">전체</option>
            <option value="CARD">카드</option>
            <option value="BANK_TRANSFER">무통장입금</option>
            <option value="KAKAO_PAY">카카오페이</option>
          </select>
        </div>

        {/* Period Filter */}
        <div>
          <label className="mb-1.5 block text-sm font-medium">기간</label>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="ALL">전체</option>
            <option value="today">오늘</option>
            <option value="week">이번 주</option>
            <option value="month">이번 달</option>
          </select>
        </div>

        {/* Search Input */}
        <div>
          <label className="mb-1.5 block text-sm font-medium">검색</label>
          <Input
            type="text"
            placeholder="광고명/업소명/주문번호"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Reset Button */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleReset}>
          초기화
        </Button>
      </div>
    </div>
  );
}
