"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BUSINESS_TYPE_LIST } from "@/lib/constants/business-types";
import { step1Schema } from "@/lib/validators/ad";
import type { AdFormData } from "@/lib/validators/ad";
import { BANNER_COLORS } from "@/lib/constants/banner-themes";
import { Banner } from "@/components/ads/Banner";
import { BUSINESS_TYPES } from "@/lib/constants/business-types";
import { Check } from "lucide-react";

interface Props {
  data: Partial<AdFormData>;
  onUpdate: (data: Partial<AdFormData>) => void;
  onNext: () => void;
}

declare global {
  interface Window {
    daum: {
      Postcode: new (options: {
        oncomplete: (data: { address: string; roadAddress: string; jibunAddress: string }) => void;
        onclose?: (state: string) => void;
        width: string;
        height: string;
      }) => { embed: (element: HTMLElement) => void };
    };
  }
}

export function Step1BusinessInfo({ data, onUpdate, onNext }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [address, setAddress] = useState(data.address || "");
  const [showPostcode, setShowPostcode] = useState(false);
  const postcodeRef = useRef<HTMLDivElement>(null);

  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    if (window.daum?.Postcode) {
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
    if (!scriptLoaded || !window.daum?.Postcode) {
      alert("주소 검색을 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    setShowPostcode(true);
    setTimeout(() => {
      if (!postcodeRef.current) return;
      new window.daum.Postcode({
        oncomplete: (result) => {
          const addr = result.roadAddress || result.jibunAddress;
          setAddress(addr);
          onUpdate({ address: addr });
          setShowPostcode(false);
        },
        onclose: () => {
          setShowPostcode(false);
        },
        width: "100%",
        height: "100%",
      }).embed(postcodeRef.current);
    }, 100);
  }, [onUpdate]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const values = {
      businessName: formData.get("businessName") as string,
      businessType: data.businessType || "",
      contactPhone: (formData.get("contactPhone") as string).replace(/-/g, ""),
      contactKakao: formData.get("contactKakao") as string,
      contactTelegram: formData.get("contactTelegram") as string,
      locationHint: formData.get("locationHint") as string,
      address: formData.get("address") as string,
      addressDetail: formData.get("addressDetail") as string,
    };

    const result = step1Schema.safeParse(values);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0];
        if (typeof path === "string") {
          fieldErrors[path] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    onUpdate(values);
    onNext();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>업소 정보 입력</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} onKeyDown={(e) => { if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA") e.preventDefault(); }} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="businessName">
              업소명 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="businessName"
              name="businessName"
              value={data.businessName || ""}
              onChange={(e) => onUpdate({ businessName: e.target.value })}
              placeholder="업소 이름"
              required
            />
            {errors.businessName && (
              <p className="text-xs text-destructive">{errors.businessName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>
              업종 <span className="text-destructive">*</span>
            </Label>
            <Select
              value={data.businessType}
              onValueChange={(v) => onUpdate({ businessType: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="업종 선택" />
              </SelectTrigger>
              <SelectContent>
                {BUSINESS_TYPE_LIST.map((bt) => (
                  <SelectItem key={bt.value} value={bt.value}>
                    {bt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.businessType && (
              <p className="text-xs text-destructive">{errors.businessType}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactPhone">
              연락처 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="contactPhone"
              name="contactPhone"
              defaultValue={data.contactPhone}
              placeholder="01012345678"
              required
            />
            {errors.contactPhone && (
              <p className="text-xs text-destructive">{errors.contactPhone}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactKakao">카카오톡 ID (선택)</Label>
            <Input
              id="contactKakao"
              name="contactKakao"
              defaultValue={data.contactKakao}
              placeholder="카카오톡 ID"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactTelegram">텔레그램 (선택)</Label>
            <Input
              id="contactTelegram"
              name="contactTelegram"
              defaultValue={data.contactTelegram}
              placeholder="@username 또는 전화번호"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="locationHint">근무지 위치 (선택)</Label>
            <Input
              id="locationHint"
              name="locationHint"
              defaultValue={data.locationHint}
              placeholder="예: 강남구 역삼동, 역삼역 3번출구 근처"
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">정확한 주소 대신 대략적 위치를 알릴 수 있습니다</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">주소 (선택)</Label>
            <div className="flex gap-2">
              <Input
                id="address"
                name="address"
                value={address}
                readOnly
                placeholder="주소 검색을 클릭하세요"
                className="flex-1 cursor-pointer bg-muted/50"
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
            <p className="text-xs text-muted-foreground">📍 상세주소 입력 시 구직자의 신뢰도가 높아집니다</p>
            {errors.address && (
              <p className="text-xs text-destructive">{errors.address}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="addressDetail">상세 주소 (선택)</Label>
            <Input
              id="addressDetail"
              name="addressDetail"
              defaultValue={data.addressDetail}
              placeholder="상세 주소"
            />
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div>
              <Label>배너 디자인 <span className="text-xs text-muted-foreground font-normal">(스페셜 이상 상품에 적용)</span></Label>
            </div>

            {/* 캐치프레이즈 입력 */}
            <div className="space-y-2">
              <Label htmlFor="bannerTitle">캐치프레이즈 (12자 이내)</Label>
              <Input
                id="bannerTitle"
                maxLength={12}
                value={data.bannerTitle || ""}
                onChange={(e) => onUpdate({ bannerTitle: e.target.value })}
                placeholder="예: 밤의 품격이 다르다"
              />
              <p className="text-xs text-muted-foreground">
                {(data.bannerTitle || "").length}/12자 · 미입력 시 업소명이 표시됩니다
              </p>
            </div>

            {/* 서브 카피 입력 */}
            <div className="space-y-2">
              <Label htmlFor="bannerSubtitle">서브 카피 (20자 이내)</Label>
              <Input
                id="bannerSubtitle"
                maxLength={20}
                value={data.bannerSubtitle || ""}
                onChange={(e) => onUpdate({ bannerSubtitle: e.target.value })}
                placeholder="예: 최고의 대우를 약속합니다"
              />
              <p className="text-xs text-muted-foreground">
                {(data.bannerSubtitle || "").length}/20자
              </p>
            </div>

            {/* 색상 선택 */}
            <div className="space-y-2">
              <Label>색상</Label>
              <div className="grid grid-cols-5 gap-2">
                {BANNER_COLORS.map((color, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => onUpdate({ bannerColor: index })}
                    className="relative flex h-10 w-full items-center justify-center rounded-full border-2 transition-all hover:scale-105"
                    style={{
                      backgroundColor: color.main,
                      borderColor: (data.bannerColor ?? 0) === index ? color.sub : "transparent",
                      boxShadow: (data.bannerColor ?? 0) === index ? `0 0 0 2px ${color.main}40` : "none",
                    }}
                    title={color.name}
                  >
                    {(data.bannerColor ?? 0) === index && (
                      <Check className="h-4 w-4 text-white drop-shadow-lg" strokeWidth={3} />
                    )}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                선택한 색상: {BANNER_COLORS[data.bannerColor ?? 0].name}
              </p>
            </div>

            {/* 템플릿 선택 그리드 */}
            <div className="space-y-2">
              <Label>템플릿 스타일</Label>
              <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-1">
                {Array.from({ length: 30 }, (_, i) => {
                  const bizInfo = BUSINESS_TYPES[(data.businessType || "KARAOKE") as keyof typeof BUSINESS_TYPES];
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => onUpdate({ bannerTemplate: i })}
                      className={`relative overflow-hidden rounded-lg border-2 transition-all hover:scale-[1.02] ${
                        (data.bannerTemplate ?? 0) === i
                          ? "border-primary shadow-lg shadow-primary/20"
                          : "border-transparent hover:border-muted-foreground/30"
                      }`}
                    >
                      <Banner
                        title={data.bannerTitle || null}
                        subtitle={data.bannerSubtitle || null}
                        businessName={data.businessName || "업소명"}
                        businessIcon={bizInfo?.icon}
                        businessLabel={bizInfo?.shortLabel}
                        businessType={data.businessType}
                        salaryText="급여 정보"
                        template={i}
                        colorIndex={data.bannerColor ?? 0}
                        size="sm"
                      />
                      {(data.bannerTemplate ?? 0) === i && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <div className="rounded-full bg-primary p-1">
                            <Check className="h-5 w-5 text-primary-foreground" strokeWidth={3} />
                          </div>
                        </div>
                      )}
                      <div className="absolute bottom-1 right-2 text-[10px] text-white/50">
                        #{i + 1}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full">
            다음 단계
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
