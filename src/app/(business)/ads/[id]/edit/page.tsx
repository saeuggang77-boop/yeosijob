"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

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
  editCount: number;
  maxEdits: number;
  status: string;
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
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
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
      setSuccess(`광고가 수정되었습니다 (${data.editCount}/${data.maxEdits}회 사용)`);
      // Update local ad state
      setAd((prev) => prev ? { ...prev, editCount: data.editCount } : prev);
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
        <Button className="mt-4" onClick={() => router.push("/dashboard")}>
          돌아가기
        </Button>
      </div>
    );
  }

  const remainingEdits = ad.maxEdits - ad.editCount;

  return (
    <div className="mx-auto max-w-screen-md px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">광고 수정</h1>
        <Badge variant="secondary">
          수정 {ad.editCount}/{ad.maxEdits}회 사용
        </Badge>
      </div>

      {remainingEdits <= 0 ? (
        <Card className="mt-6">
          <CardContent className="py-12 text-center">
            <p className="text-lg font-medium">수정 가능 횟수를 모두 사용했습니다</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {ad.maxEdits}회 수정을 모두 사용했습니다
            </p>
            <Button className="mt-4" variant="outline" onClick={() => router.push("/dashboard")}>
              돌아가기
            </Button>
          </CardContent>
        </Card>
      ) : (
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
                <Label htmlFor="address">주소</Label>
                <input
                  id="address"
                  value={form.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
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

          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => router.push("/dashboard")}>
              취소
            </Button>
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving ? "저장 중..." : `수정하기 (${remainingEdits}회 남음)`}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
