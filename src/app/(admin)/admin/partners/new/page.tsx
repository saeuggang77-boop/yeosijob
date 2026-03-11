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
  const [result, setResult] = useState<{
    paymentLink: string | null;
    isFree: boolean;
  } | null>(null);

  const [formData, setFormData] = useState({
    userEmail: "",
    grade: "",
    isFree: false,
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

      if (formData.isFree) {
        setResult({ paymentLink: null, isFree: true });
      } else {
        const link = `${window.location.origin}/partner/pay/${data.paymentToken}`;
        setResult({ paymentLink: link, isFree: false });
      }
      toast.success("제휴업체가 등록되었습니다");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "등록 중 오류가 발생했습니다";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    if (result?.paymentLink) {
      navigator.clipboard.writeText(result.paymentLink);
      toast.success("링크가 복사되었습니다");
    }
  };

  if (result) {
    return (
      <div>
        <h1 className="text-2xl font-bold">제휴업체 등록 완료</h1>
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>
              {result.isFree ? "무료 입점 완료" : "결제 링크"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.isFree ? (
              <>
                <div className="rounded-md border border-green-500/30 bg-green-500/10 p-4">
                  <p className="font-medium text-green-500">
                    무료 입점이 완료되었습니다
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    업체에 로그인 후 [제휴업체] 메뉴에서 정보를 입력하도록
                    안내해주세요.
                    <br />
                    정보 입력 완료 시 제휴업체 페이지에 노출됩니다.
                  </p>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  아래 링크를 업체에 전달하여 결제를 진행하세요.
                  <br />
                  결제 완료 후 업체가 직접 상세 정보를 입력합니다.
                </p>
                <div className="flex gap-2">
                  <Input
                    value={result.paymentLink || ""}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button onClick={copyLink}>링크 복사</Button>
                </div>
              </>
            )}
            <Button
              onClick={() => router.push("/admin/partners")}
              variant="outline"
              className="w-full"
            >
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
                onChange={(e) =>
                  setFormData({ ...formData, userEmail: e.target.value })
                }
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
                onValueChange={(value) =>
                  setFormData({ ...formData, grade: value })
                }
              >
                <SelectTrigger id="grade">
                  <SelectValue placeholder="등급 선택" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PARTNER_GRADES).map(([key, info]) => (
                    <SelectItem key={key} value={key}>
                      {info.label} - {info.price.toLocaleString()}원/월 (
                      {info.description})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3 rounded-md border p-3">
              <input
                type="checkbox"
                id="isFree"
                checked={formData.isFree}
                onChange={(e) =>
                  setFormData({ ...formData, isFree: e.target.checked })
                }
                className="h-4 w-4 rounded border-gray-300"
              />
              <div>
                <Label htmlFor="isFree" className="cursor-pointer">
                  무료 입점
                </Label>
                <p className="text-xs text-muted-foreground">
                  결제 없이 바로 활성화됩니다 (금액 0원)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading
              ? "등록 중..."
              : formData.isFree
                ? "무료 등록"
                : "등록 + 결제링크 생성"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            취소
          </Button>
        </div>
      </form>
    </div>
  );
}
