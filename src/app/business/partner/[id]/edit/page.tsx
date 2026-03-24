"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { AdImageUploader } from "@/components/ads/AdImageUploader";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

declare global {
  interface Window {
    daum: {
      Postcode: new (options: {
        oncomplete: (data: {
          address: string;
          roadAddress: string;
          jibunAddress: string;
        }) => void;
        onclose?: (state: string) => void;
        width: string;
        height: string;
      }) => { embed: (element: HTMLElement) => void };
    };
  }
}

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
  detailImages: string[];
  contactPhone: string | null;
  contactKakao: string | null;
  websiteUrl: string | null;
  businessHours: string | null;
  grade: string | null;
  status: string;
  isProfileComplete: boolean;
  businessNumber: string | null;
  bizOwnerName: string | null;
  isVerifiedBiz: boolean;
}

function formatPhone(value: string): string {
  const nums = value.replace(/[^0-9]/g, "");
  if (nums.startsWith("02")) {
    if (nums.length <= 2) return nums;
    if (nums.length <= 5) return `${nums.slice(0, 2)}-${nums.slice(2)}`;
    if (nums.length <= 9)
      return `${nums.slice(0, 2)}-${nums.slice(2, 5)}-${nums.slice(5)}`;
    return `${nums.slice(0, 2)}-${nums.slice(2, 6)}-${nums.slice(6, 10)}`;
  }
  if (nums.length <= 3) return nums;
  if (nums.length <= 7) return `${nums.slice(0, 3)}-${nums.slice(3)}`;
  return `${nums.slice(0, 3)}-${nums.slice(3, 7)}-${nums.slice(7, 11)}`;
}

export default function BusinessPartnerEditPage() {
  const router = useRouter();
  const params = useParams();
  const partnerId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPostcode, setShowPostcode] = useState(false);
  const postcodeRef = useRef<HTMLDivElement>(null);

  // 사업자 인증
  const [bizNumber, setBizNumber] = useState("");
  const [bizOwnerName, setBizOwnerName] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ verified: boolean; message: string } | null>(null);
  const [isVerifiedBiz, setIsVerifiedBiz] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    highlight: "",
    category: "",
    region: "",
    address: "",
    description: "",
    thumbnailUrl: "",
    detailImages: [] as string[],
    contactPhone: "",
    contactKakao: "",
    websiteUrl: "",
    businessHours: "",
  });

  // Load Daum Postcode script
  useEffect(() => {
    if (window.daum?.Postcode) return;
    const existing = document.getElementById("daum-postcode-script");
    if (existing) return;
    const script = document.createElement("script");
    script.id = "daum-postcode-script";
    script.src =
      "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    script.async = true;
    document.head.appendChild(script);
  }, []);

  const openPostcode = useCallback(() => {
    if (!window.daum?.Postcode) {
      toast.error("주소 검색을 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    setShowPostcode(true);
    setTimeout(() => {
      if (!postcodeRef.current) return;
      new window.daum.Postcode({
        oncomplete: (result) => {
          const addr = result.roadAddress || result.jibunAddress;
          setFormData((prev) => ({ ...prev, address: addr }));
          setShowPostcode(false);
        },
        onclose: () => {
          setShowPostcode(false);
        },
        width: "100%",
        height: "100%",
      }).embed(postcodeRef.current);
    }, 100);
  }, []);

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
          highlight: p.highlight || "",
          category: p.category,
          region: p.region,
          address: p.address || "",
          description: p.description,
          thumbnailUrl: p.thumbnailUrl || "",
          detailImages: p.detailImages || [],
          contactPhone: p.contactPhone ? formatPhone(p.contactPhone) : "",
          contactKakao: p.contactKakao || "",
          websiteUrl: p.websiteUrl || "",
          businessHours: p.businessHours || "",
        });
        setIsVerifiedBiz(p.isVerifiedBiz);
        if (p.businessNumber) setBizNumber(p.businessNumber);
        if (p.bizOwnerName) setBizOwnerName(p.bizOwnerName);
      } catch {
        toast.error("데이터를 불러올 수 없습니다");
        router.push("/business/partner");
      } finally {
        setLoading(false);
      }
    };

    fetchPartner();
  }, [partnerId, router]);

  const handleVerify = async () => {
    const cleaned = bizNumber.replace(/[^0-9]/g, "");
    if (cleaned.length < 10) {
      toast.error("올바른 사업자등록번호를 입력해주세요");
      return;
    }
    if (!bizOwnerName.trim()) {
      toast.error("대표자명을 입력해주세요");
      return;
    }
    setVerifying(true);
    setVerifyResult(null);
    try {
      const res = await fetch("/api/partners/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partnerId, businessNumber: cleaned, ownerName: bizOwnerName.trim() }),
      });
      const data = await res.json();
      if (data.verified) {
        setVerifyResult({ verified: true, message: data.message });
        setIsVerifiedBiz(true);
        toast.success("사업자 인증 완료");
      } else {
        setVerifyResult({ verified: false, message: data.error || data.message || "인증 실패" });
      }
    } catch {
      toast.error("서버 오류가 발생했습니다");
    } finally {
      setVerifying(false);
    }
  };

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

    setSaving(true);
    try {
      const res = await fetch(`/api/business/partners/${partnerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          contactPhone: formData.contactPhone.replace(/-/g, ""),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "저장 실패");
      }

      toast.success("업체 정보가 저장되었습니다");
      router.push("/business/partner");
      router.refresh();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "저장 중 오류가 발생했습니다";
      toast.error(message);
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
        {/* 사업자 인증 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span>사업자 인증</span>
              {isVerifiedBiz && (
                <Badge className="bg-green-100 text-green-700">인증완료</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isVerifiedBiz ? (
              <div className="text-sm text-muted-foreground">
                <p>사업자번호: {bizNumber.replace(/(\d{3})(\d{2})(\d{5})/, "$1-$2-$3")}</p>
                <p>대표자명: {bizOwnerName}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">사업자등록증에 기재된 정보를 입력해주세요</p>
                <div className="space-y-2">
                  <Label>사업자등록번호</Label>
                  <Input
                    value={bizNumber}
                    onChange={(e) => setBizNumber(e.target.value)}
                    placeholder="000-00-00000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>대표자명</Label>
                  <Input
                    value={bizOwnerName}
                    onChange={(e) => setBizOwnerName(e.target.value)}
                    placeholder="사업자등록증에 기재된 대표자명"
                  />
                </div>
                <Button type="button" onClick={handleVerify} disabled={verifying} className="w-full">
                  {verifying ? "확인 중..." : "인증하기"}
                </Button>
                {verifyResult && (
                  <p className={`text-xs ${verifyResult.verified ? "text-green-600" : "text-red-500"}`}>
                    {verifyResult.message}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 기본 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">
                업체명 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="예: 강남 뷰티클리닉"
              />
            </div>

            <div>
              <Label htmlFor="highlight">광고 제목</Label>
              <Input
                id="highlight"
                value={formData.highlight}
                onChange={(e) => {
                  if (e.target.value.length <= 30) {
                    setFormData({ ...formData, highlight: e.target.value });
                  }
                }}
                placeholder="예: 업계종사자 특별할인 20%"
                maxLength={30}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {formData.highlight.length}/30자 · 리스트에서 업체명 아래에
                표시됩니다
              </p>
            </div>

            <div>
              <Label htmlFor="category">
                업종 <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
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
              <Label htmlFor="region">
                지역 <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.region}
                onValueChange={(value) =>
                  setFormData({ ...formData, region: value })
                }
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
              <div className="flex gap-2">
                <Input
                  id="address"
                  value={formData.address}
                  readOnly
                  placeholder="주소 검색을 클릭하세요"
                  className="flex-1 cursor-pointer bg-muted/50"
                  onClick={openPostcode}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={openPostcode}
                  className="shrink-0"
                >
                  주소 검색
                </Button>
              </div>
              {showPostcode && (
                <div className="relative mt-2 overflow-hidden rounded-md border">
                  <div ref={postcodeRef} className="h-[400px] w-full" />
                  <button
                    type="button"
                    onClick={() => setShowPostcode(false)}
                    className="absolute right-2 top-2 z-10 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white hover:bg-black/80"
                  >
                    닫기
                  </button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 이미지 */}
        <Card>
          <CardHeader>
            <CardTitle>이미지</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>대표 이미지</Label>
              <p className="mb-2 text-xs text-muted-foreground">
                제휴업체 목록 카드에 표시됩니다 · 권장: 800×600px (4:3 비율)
              </p>
              <AdImageUploader
                images={formData.thumbnailUrl ? [formData.thumbnailUrl] : []}
                onChange={(imgs) =>
                  setFormData({ ...formData, thumbnailUrl: imgs[0] || "" })
                }
                maxImages={1}
              />
            </div>

            <div>
              <Label>상세 이미지</Label>
              <p className="mb-2 text-xs text-muted-foreground">
                업체 상세 페이지에 표시됩니다 · 권장: 가로 1080px 이상 · 최대
                10장
              </p>
              <AdImageUploader
                images={formData.detailImages}
                onChange={(imgs) =>
                  setFormData({ ...formData, detailImages: imgs })
                }
                maxImages={10}
              />
            </div>
          </CardContent>
        </Card>

        {/* 업체 소개 */}
        <Card>
          <CardHeader>
            <CardTitle>업체 소개</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="업체 소개를 입력하세요 (선택사항)"
              rows={4}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              상세 이미지가 있으면 소개글은 선택사항입니다
            </p>
          </CardContent>
        </Card>

        {/* 연락처 */}
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
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contactPhone: formatPhone(e.target.value),
                  })
                }
                placeholder="예: 010-1234-5678"
              />
            </div>

            <div>
              <Label htmlFor="contactKakao">카카오톡 링크</Label>
              <Input
                id="contactKakao"
                value={formData.contactKakao}
                onChange={(e) =>
                  setFormData({ ...formData, contactKakao: e.target.value })
                }
                placeholder="예: http://pf.kakao.com/..."
              />
            </div>

            <div>
              <Label htmlFor="websiteUrl">홈페이지</Label>
              <Input
                id="websiteUrl"
                value={formData.websiteUrl}
                onChange={(e) =>
                  setFormData({ ...formData, websiteUrl: e.target.value })
                }
                placeholder="https://example.com"
              />
            </div>

            <div>
              <Label htmlFor="businessHours">영업시간</Label>
              <Input
                id="businessHours"
                value={formData.businessHours}
                onChange={(e) =>
                  setFormData({ ...formData, businessHours: e.target.value })
                }
                placeholder="예: 평일 09:00-18:00"
              />
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
