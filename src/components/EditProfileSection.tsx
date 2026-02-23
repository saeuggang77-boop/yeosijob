"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, ChevronRight, ChevronDown } from "lucide-react";

interface EditProfileSectionProps {
  currentName: string;
  currentPhone: string;
  currentBusinessName?: string;
  isBusiness: boolean;
}

export default function EditProfileSection({
  currentName,
  currentPhone,
  currentBusinessName,
  isBusiness,
}: EditProfileSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(currentName);
  const [phone, setPhone] = useState(currentPhone);
  const [businessName, setBusinessName] = useState(currentBusinessName || "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const body: Record<string, string> = { name, phone };
      if (isBusiness) body.businessName = businessName;

      const res = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      setSuccess(data.message);
      setTimeout(() => {
        setSuccess("");
        // 페이지 새로고침으로 서버 컴포넌트 데이터 갱신
        window.location.reload();
      }, 1500);
    } catch {
      setError("서버 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <button
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
            setError("");
            setSuccess("");
          }}
          className="flex w-full items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <User className="size-5 text-muted-foreground" />
            <span className="font-medium">프로필 수정</span>
          </div>
          {isOpen ? (
            <ChevronDown className="size-5 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-5 text-muted-foreground" />
          )}
        </button>

        {isOpen && (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profileName">이름</Label>
              <Input
                id="profileName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="2자 이상"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profilePhone">휴대폰 번호</Label>
              <Input
                id="profilePhone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01012345678"
              />
            </div>
            {isBusiness && (
              <div className="space-y-2">
                <Label htmlFor="profileBusinessName">업소명</Label>
                <Input
                  id="profileBusinessName"
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                />
              </div>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}
            {success && <p className="text-sm text-green-600">{success}</p>}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "수정 중..." : "프로필 수정"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
