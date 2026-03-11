"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { Partner } from "@/generated/prisma/client";

interface PartnerAdminActionsProps {
  partner: Partner;
  paymentLink: string | null;
}

export function PartnerAdminActions({ partner, paymentLink }: PartnerAdminActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [regeneratedLink, setRegeneratedLink] = useState("");

  const handleStatusChange = async (newStatus: string) => {
    if (!confirm(`상태를 "${newStatus}"로 변경하시겠습니까?`)) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/partners/${partner.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "상태 변경 실패");
      }

      toast.success("상태가 변경되었습니다");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "상태 변경 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateLink = async () => {
    if (!confirm("결제 링크를 재생성하시겠습니까?")) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/partners/${partner.id}/regenerate-link`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "링크 재생성 실패");
      }

      const link = `${window.location.origin}/partner/pay/${data.paymentToken}`;
      setRegeneratedLink(link);
      toast.success("결제 링크가 재생성되었습니다");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "링크 재생성 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/partners/${partner.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "삭제 실패");
      }

      toast.success("제휴업체가 삭제되었습니다");
      router.push("/admin/partners");
    } catch (error: any) {
      toast.error(error.message || "삭제 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success("링크가 복사되었습니다");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>관리자 작업</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Change */}
        <div>
          <label className="mb-2 block text-sm font-medium">상태 변경</label>
          <Select onValueChange={handleStatusChange} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder="상태 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING_PAYMENT">결제대기</SelectItem>
              <SelectItem value="ACTIVE">활성</SelectItem>
              <SelectItem value="EXPIRED">만료</SelectItem>
              <SelectItem value="CANCELLED">취소</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Payment Link Display */}
        {(paymentLink || regeneratedLink) && (
          <div>
            <label className="mb-2 block text-sm font-medium">결제 링크</label>
            <div className="flex gap-2">
              <Input
                value={regeneratedLink || paymentLink || ""}
                readOnly
                className="font-mono text-xs"
              />
              <Button onClick={() => copyLink(regeneratedLink || paymentLink || "")} size="sm">
                복사
              </Button>
            </div>
          </div>
        )}

        {/* Regenerate Link Button */}
        <Button
          onClick={handleRegenerateLink}
          disabled={loading}
          variant="outline"
          className="w-full"
        >
          결제 링크 재생성
        </Button>

        {/* Delete Button */}
        <Button
          onClick={handleDelete}
          disabled={loading}
          variant="destructive"
          className="w-full"
        >
          삭제
        </Button>
      </CardContent>
    </Card>
  );
}
