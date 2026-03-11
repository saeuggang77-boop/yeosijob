"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
import { PARTNER_CATEGORIES } from "@/lib/constants/partners";
import { REGIONS } from "@/lib/constants/regions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface PartnerData {
  id: string;
  name: string;
  category: string;
  region: string;
  address: string | null;
  description: string;
  highlight: string | null;
  tags: string[];
  thumbnailUrl: string | null;
  contactPhone: string | null;
  contactKakao: string | null;
  websiteUrl: string | null;
  businessHours: string | null;
  grade: string;
  status: string;
  isProfileComplete: boolean;
}

export default function BusinessPartnerEditPage() {
  const router = useRouter();
  const params = useParams();
  const partnerId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    region: "",
    address: "",
    description: "",
    highlight: "",
    tags: "",
    thumbnailUrl: "",
    contactPhone: "",
    contactKakao: "",
    websiteUrl: "",
    businessHours: "",
  });

  useEffect(() => {
    const fetchPartner = async () => {
      try {
        const res = await fetch(`/api/business/partners/${partnerId}`);
        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || "데이터를 불러올 수 없습니다");
          router.push("/business/partner");
          return;
        }

        const p: PartnerData = data.partner;
        setFormData({
          name: p.name === "미등록 업체" ? "" : p.name,
          category: p.category,
          region: p.region,
          address: p.address || "",
          description: p.description,
          highlight: p.highlight || "",
          tags: p.tags.join(", "),
          thumbnailUrl: p.thumbnailUrl || "",
          contactPhone: p.contactPhone || "",
          contactKakao: p.contactKakao || "",
          websiteUrl: p.websiteUrl || "",
          businessHours: p.businessHours || "",
        });
      } catch {
        toast.error("데이터를 불러올 수 없습니다");
        router.push("/business/partner");
      } finally {
        setLoading(false);
      }
    };

    fetchPartner();
  }, [partnerId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("업체명을 입력해주세요");
      return;
    }
    if (!formData.category) {
      toast.error("업종을 선택해주세요");
      return;
    }
    if (!formData.region) {
      toast.error("지역을 선택해주세요");
      return;
    }
    if (!formData.description.trim()) {
      toast.error("업체 소개를 입력해주세요");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/business/partners/${partnerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "저장 실패");
      }

      toast.success("업체 정보가 저장되었습니다");
      router.push("/business/partner");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "저장 중 오류가 발생했습니다");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">업체 정보 입력</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        제휴업체 페이지에 노출될 정보를 입력해주세요.
        <br />
        필수 항목을 모두 입력하면 제휴업체 페이지에 노출됩니다.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">업체명 *</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="예: 강남 뷰티클리닉"
              />
            </div>

            <div>
              <Label htmlFor="category">업종 *</Label>
              <Select
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
                placeholder="예: 서울시 강남구 역삼동 123"
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
              <Label htmlFor="highlight">한줄 소개</Label>
              <Input
                id="highlight"
                value={formData.highlight}
                onChange={(e) => setFormData({ ...formData, highlight: e.target.value })}
                placeholder="예: 업계종사자 특별할인 20%"
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>연락처</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="contactPhone">전화번호</Label>
              <Input
                id="contactPhone"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                placeholder="예: 02-1234-5678"
              />
            </div>

            <div>
              <Label htmlFor="contactKakao">카카오톡 링크</Label>
              <Input
                id="contactKakao"
                value={formData.contactKakao}
                onChange={(e) => setFormData({ ...formData, contactKakao: e.target.value })}
                placeholder="예: http://pf.kakao.com/..."
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>이미지</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="thumbnailUrl">대표 이미지 URL</Label>
              <Input
                id="thumbnailUrl"
                type="url"
                value={formData.thumbnailUrl}
                onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                제휴업체 목록에 표시될 대표 이미지입니다
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "저장 중..." : "저장"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/business/partner")}
          >
            취소
          </Button>
        </div>
      </form>
    </div>
  );
}
