"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { BANNER_COLORS } from "@/lib/constants/banner-themes";
import { BannerPreview } from "@/components/ads/BannerPreview";
import { Check } from "lucide-react";

interface AdData {
  id: string;
  title: string;
  salaryText: string;
  workHours: string | null;
  benefits: string | null;
  description: string;
  contactPhone: string;
  contactKakao: string | null;
  address: string | null;
  addressDetail: string | null;
  status: string;
  businessName: string;
  businessType: string;
  bannerColor: number;
}

export default function EditAdPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [ad, setAd] = useState<AdData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showPostcode, setShowPostcode] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const postcodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).daum?.Postcode) {
      setScriptLoaded(true);
      return;
    }
    const existing = document.getElementById("daum-postcode-script");
    if (existing) {
      existing.addEventListener("load", () => setScriptLoaded(true));
      return;
    }
    const script = document.createElement("script");
    script.id = "daum-postcode-script";
    script.src = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    document.head.appendChild(script);
  }, []);

  const openPostcode = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!scriptLoaded || !(window as any).daum?.Postcode) {
      alert("주소 검색을 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    setShowPostcode(true);
    setTimeout(() => {
      if (!postcodeRef.current) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      new (window as any).daum.Postcode({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        oncomplete: (result: any) => {
          const addr = result.roadAddress || result.jibunAddress;
          setForm((prev) => ({ ...prev, address: addr }));
          setShowPostcode(false);
        },
        onclose: () => setShowPostcode(false),
        width: "100%",
        height: "100%",
      }).embed(postcodeRef.current);
    }, 100);
  }, []);

  const [form, setForm] = useState({
    title: "",
    salaryText: "",
    workHours: "",
    benefits: "",
    description: "",
    contactPhone: "",
    contactKakao: "",
    address: "",
    addressDetail: "",
    bannerColor: 0,
  });

  useEffect(() => {
    fetch(`/api/ads/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("광고를 찾을 수 없습니다");
        const data = await res.json();
        setAd(data);
        setForm({
          title: data.title || "",
          salaryText: data.salaryText || "",
          workHours: data.workHours || "",
          benefits: data.benefits || "",
          description: data.description || "",
          contactPhone: data.contactPhone || "",
          contactKakao: data.contactKakao || "",
          address: data.address || "",
          addressDetail: data.addressDetail || "",
          bannerColor: data.bannerColor ?? 0,
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  function updateField(field: string, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: field === "bannerColor" ? parseInt(value, 10) : value
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const res = await fetch(`/api/ads/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "수정에 실패했습니다");
        return;
      }
      setSuccess("광고가 수정되었습니다");
    } catch {
      setError("서버 오류가 발생했습니다");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-screen-md px-4 py-20 text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-4 text-lg font-medium">로딩 중...</p>
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="mx-auto max-w-screen-md px-4 py-20 text-center">
        <p className="text-lg text-muted-foreground">{error || "광고를 찾을 수 없습니다"}</p>
        <Button className="mt-4" onClick={() => router.push("/business/dashboard")}>
          돌아가기
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-md px-4 py-6">
      <h1 className="text-2xl font-bold">광고 수정</h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}
          {success && (
            <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">{success}</div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">채용 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">채용 제목 *</Label>
                <input
                  id="title"
                  value={form.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>
              <div>
                <Label htmlFor="salaryText">급여 *</Label>
                <input
                  id="salaryText"
                  value={form.salaryText}
                  onChange={(e) => updateField("salaryText", e.target.value)}
                  className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>
              <div>
                <Label htmlFor="workHours">근무시간</Label>
                <input
                  id="workHours"
                  value={form.workHours}
                  onChange={(e) => updateField("workHours", e.target.value)}
                  className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <Label htmlFor="benefits">복리후생 / 혜택</Label>
                <input
                  id="benefits"
                  value={form.benefits}
                  onChange={(e) => updateField("benefits", e.target.value)}
                  className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <Label htmlFor="description">상세 설명 *</Label>
                <textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={5}
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">연락처</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="contactPhone">연락처 *</Label>
                <input
                  id="contactPhone"
                  value={form.contactPhone}
                  onChange={(e) => updateField("contactPhone", e.target.value)}
                  className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>
              <div>
                <Label htmlFor="contactKakao">카카오톡 ID</Label>
                <input
                  id="contactKakao"
                  value={form.contactKakao}
                  onChange={(e) => updateField("contactKakao", e.target.value)}
                  className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <Label htmlFor="address">주소 *</Label>
                <div className="mt-1 flex gap-2">
                  <input
                    id="address"
                    value={form.address}
                    readOnly
                    placeholder="주소 검색을 클릭하세요"
                    className="h-10 flex-1 cursor-pointer rounded-md border bg-muted/50 px-3 text-sm outline-none"
                    onClick={openPostcode}
                  />
                  <Button type="button" variant="outline" onClick={openPostcode} className="shrink-0">
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
              <div>
                <Label htmlFor="addressDetail">상세주소</Label>
                <input
                  id="addressDetail"
                  value={form.addressDetail}
                  onChange={(e) => updateField("addressDetail", e.target.value)}
                  className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">배너 디자인</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>배너 색상</Label>
                <div className="mt-2 grid grid-cols-5 gap-2">
                  {BANNER_COLORS.map((color, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => updateField("bannerColor", index.toString())}
                      className="relative flex h-12 w-full items-center justify-center rounded-full border-2 transition-all hover:scale-105"
                      style={{
                        backgroundColor: color.main,
                        borderColor: form.bannerColor === index ? color.sub : "transparent",
                        boxShadow: form.bannerColor === index ? `0 0 0 2px ${color.main}40` : "none",
                      }}
                      title={color.name}
                    >
                      {form.bannerColor === index && (
                        <Check className="h-5 w-5 text-white drop-shadow-lg" strokeWidth={3} />
                      )}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  선택한 색상: {BANNER_COLORS[form.bannerColor].name}
                </p>
              </div>

              <div>
                <Label>배너 미리보기</Label>
                <div className="mt-2">
                  <BannerPreview
                    businessName={ad?.businessName || "업소명"}
                    businessType={ad?.businessType || "KARAOKE"}
                    regions={[]}
                    salaryText={form.salaryText || "급여 정보"}
                    bannerColor={form.bannerColor}
                    adId={ad?.id}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  * 레이아웃과 패턴은 광고 등록 시 자동으로 결정됩니다
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => router.push("/business/dashboard")}>
              취소
            </Button>
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving ? "저장 중..." : "수정하기"}
            </Button>
          </div>
        </form>
    </div>
  );
}
