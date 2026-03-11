"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PARTNER_GRADES, PARTNER_CATEGORIES } from "@/lib/constants/partners";
import { REGIONS } from "@/lib/constants/regions";
import { toast } from "sonner";

export default function AdminPartnerNewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [paymentLink, setPaymentLink] = useState("");

  const [formData, setFormData] = useState({
    userEmail: "",
    name: "",
    category: "",
    region: "",
    address: "",
    description: "",
    highlight: "",
    tags: "",
    grade: "",
    monthlyPrice: "",
    contactPhone: "",
    contactKakao: "",
    websiteUrl: "",
    businessHours: "",
    thumbnailUrl: "",
  });

  const handleGradeChange = (grade: string) => {
    const gradeInfo = PARTNER_GRADES[grade as keyof typeof PARTNER_GRADES];
    setFormData((prev) => ({
      ...prev,
      grade,
      monthlyPrice: gradeInfo ? gradeInfo.price.toString() : "",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/admin/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
          monthlyPrice: parseInt(formData.monthlyPrice, 10),
        }),
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
              아래 링크를 업체에 전달하여 결제를 진행하세요
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

      <form onSubmit={handleSubmit} className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>업체 정보</CardTitle>
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
            </div>

            <div>
              <Label htmlFor="name">업체명 *</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="예: 강남 성형외과"
              />
            </div>

            <div>
              <Label htmlFor="category">업종 *</Label>
              <Select
                required
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="업종 선택" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PARTNER_CATEGORIES).map(([key, info]) => (
                    <SelectItem key={key} value={key}>
                      {info.emoji} {info.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="region">지역 *</Label>
              <Select
                required
                value={formData.region}
                onValueChange={(value) => setFormData({ ...formData, region: value })}
              >
                <SelectTrigger id="region">
                  <SelectValue placeholder="지역 선택" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(REGIONS).map(([key, info]) => (
                    <SelectItem key={key} value={key}>
                      {info.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="address">주소</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="상세 주소"
              />
            </div>

            <div>
              <Label htmlFor="description">업체 소개 *</Label>
              <Textarea
                id="description"
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="업체 소개를 입력하세요"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="highlight">하이라이트</Label>
              <Input
                id="highlight"
                value={formData.highlight}
                onChange={(e) => setFormData({ ...formData, highlight: e.target.value })}
                placeholder="예: 업계종사자 특별할인"
              />
            </div>

            <div>
              <Label htmlFor="tags">태그 (쉼표로 구분)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="예: 할인, 쿠폰, 이벤트"
              />
            </div>

            <div>
              <Label htmlFor="grade">등급 *</Label>
              <Select
                required
                value={formData.grade}
                onValueChange={handleGradeChange}
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

            <div>
              <Label htmlFor="monthlyPrice">월 금액 *</Label>
              <Input
                id="monthlyPrice"
                type="number"
                required
                value={formData.monthlyPrice}
                onChange={(e) => setFormData({ ...formData, monthlyPrice: e.target.value })}
                placeholder="등급 선택 시 자동 입력"
              />
            </div>

            <div>
              <Label htmlFor="contactPhone">연락처</Label>
              <Input
                id="contactPhone"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                placeholder="예: 02-1234-5678"
              />
            </div>

            <div>
              <Label htmlFor="contactKakao">카카오톡</Label>
              <Input
                id="contactKakao"
                value={formData.contactKakao}
                onChange={(e) => setFormData({ ...formData, contactKakao: e.target.value })}
                placeholder="카카오톡 ID"
              />
            </div>

            <div>
              <Label htmlFor="websiteUrl">홈페이지</Label>
              <Input
                id="websiteUrl"
                type="url"
                value={formData.websiteUrl}
                onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                placeholder="https://example.com"
              />
            </div>

            <div>
              <Label htmlFor="businessHours">영업시간</Label>
              <Input
                id="businessHours"
                value={formData.businessHours}
                onChange={(e) => setFormData({ ...formData, businessHours: e.target.value })}
                placeholder="예: 평일 09:00-18:00"
              />
            </div>

            <div>
              <Label htmlFor="thumbnailUrl">썸네일 URL</Label>
              <Input
                id="thumbnailUrl"
                type="url"
                value={formData.thumbnailUrl}
                onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
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
