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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="businessName">
              업소명 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="businessName"
              name="businessName"
              defaultValue={data.businessName}
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
            <Label htmlFor="address">
              주소 <span className="text-destructive">*</span>
            </Label>
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

          <Button type="submit" className="w-full">
            다음 단계
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
