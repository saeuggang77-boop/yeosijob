"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PARTNER_GRADES } from "@/lib/constants/partners";
import { toast } from "sonner";

export default function AdminPartnerNewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [paymentLink, setPaymentLink] = useState("");

  const [formData, setFormData] = useState({
    userEmail: "",
    grade: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/admin/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "등록 실패");
      }

      const link = `${window.location.origin}/partner/pay/${data.paymentToken}`;
      setPaymentLink(link);
      toast.success("제휴업체가 등록되었습니다");
    } catch (error: any) {
      toast.error(error.message || "등록 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(paymentLink);
    toast.success("링크가 복사되었습니다");
  };

  if (paymentLink) {
    return (
      <div>
        <h1 className="text-2xl font-bold">제휴업체 등록 완료</h1>
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>결제 링크</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              아래 링크를 업체에 전달하여 결제를 진행하세요.
              <br />
              결제 완료 후 업체가 직접 상세 정보를 입력합니다.
            </p>
            <div className="flex gap-2">
              <Input value={paymentLink} readOnly className="font-mono text-sm" />
              <Button onClick={copyLink}>링크 복사</Button>
            </div>
            <Button onClick={() => router.push("/admin/partners")} variant="outline" className="w-full">
              목록으로
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">새 제휴업체 등록</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        업체 이메일과 등급만 입력하면 결제 링크가 생성됩니다.
        <br />
        상세 정보는 업체가 결제 후 직접 입력합니다.
      </p>

      <form onSubmit={handleSubmit} className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>등록 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="userEmail">업체 계정 이메일 *</Label>
              <Input
                id="userEmail"
                type="email"
                required
                value={formData.userEmail}
                onChange={(e) => setFormData({ ...formData, userEmail: e.target.value })}
                placeholder="사업자 계정의 이메일 입력"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                사장님으로 가입된 이메일만 등록 가능합니다
              </p>
            </div>

            <div>
              <Label htmlFor="grade">등급 *</Label>
              <Select
                required
                value={formData.grade}
                onValueChange={(value) => setFormData({ ...formData, grade: value })}
              >
                <SelectTrigger id="grade">
                  <SelectValue placeholder="등급 선택" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PARTNER_GRADES).map(([key, info]) => (
                    <SelectItem key={key} value={key}>
                      {info.label} - {info.price.toLocaleString()}원/월 ({info.description})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? "등록 중..." : "등록 + 결제링크 생성"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            취소
          </Button>
        </div>
      </form>
    </div>
  );
}
