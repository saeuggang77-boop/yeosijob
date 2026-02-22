"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const REGION_OPTIONS = [
  { value: "SEOUL", label: "서울" },
  { value: "GYEONGGI", label: "경기" },
  { value: "INCHEON", label: "인천" },
  { value: "BUSAN", label: "부산" },
  { value: "DAEGU", label: "대구" },
  { value: "DAEJEON", label: "대전" },
  { value: "GWANGJU", label: "광주" },
  { value: "ULSAN", label: "울산" },
  { value: "SEJONG", label: "세종" },
  { value: "GANGWON", label: "강원" },
  { value: "CHUNGBUK", label: "충북" },
  { value: "CHUNGNAM", label: "충남" },
  { value: "JEONBUK", label: "전북" },
  { value: "JEONNAM", label: "전남" },
  { value: "GYEONGBUK", label: "경북" },
  { value: "GYEONGNAM", label: "경남" },
  { value: "JEJU", label: "제주" },
];

const JOB_OPTIONS = [
  { value: "KARAOKE", label: "노래방/가라오케" },
  { value: "ROOM_SALON", label: "룸싸롱" },
  { value: "TEN_CAFE", label: "텐카페" },
  { value: "SHIRT_ROOM", label: "셔츠룸" },
  { value: "LEGGINGS_ROOM", label: "레깅스룸" },
  { value: "PUBLIC_BAR", label: "퍼블릭바" },
  { value: "HYPER_PUBLIC", label: "하이퍼블릭" },
  { value: "BAR_LOUNGE", label: "바/라운지" },
  { value: "CLUB", label: "클럽" },
  { value: "MASSAGE", label: "마사지" },
  { value: "GUANRI", label: "관리사" },
  { value: "OTHER", label: "기타" },
];

export default function MyResumePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    nickname: "",
    age: "",
    region: "",
    district: "",
    desiredJobs: [] as string[],
    experience: "",
    introduction: "",
    isPublic: true,
  });

  useEffect(() => {
    // Fetch existing resume
    fetch("/api/resumes/mine")
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          if (data.resume) {
            setHasExisting(true);
            setForm({
              nickname: data.resume.nickname || "",
              age: data.resume.age?.toString() || "",
              region: data.resume.region || "",
              district: data.resume.district || "",
              desiredJobs: data.resume.desiredJobs || [],
              experience: data.resume.experience || "",
              introduction: data.resume.introduction || "",
              isPublic: data.resume.isPublic !== false,
            });
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function updateField(field: string, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleJob(job: string) {
    setForm((prev) => {
      const jobs = [...prev.desiredJobs];
      const idx = jobs.indexOf(job);
      if (idx >= 0) jobs.splice(idx, 1);
      else jobs.push(job);
      return { ...prev, desiredJobs: jobs };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const res = await fetch("/api/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setSuccess(data.message);
      setHasExisting(true);
    } catch {
      setError("서버 오류가 발생했습니다");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("이력서를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) return;
    setError("");
    setSuccess("");
    setDeleting(true);
    try {
      const res = await fetch("/api/resumes/mine", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setSuccess("이력서가 삭제되었습니다");
      setHasExisting(false);
      setForm({ nickname: "", age: "", region: "", district: "", desiredJobs: [], experience: "", introduction: "", isPublic: true });
    } catch {
      setError("서버 오류가 발생했습니다");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-screen-md px-4 py-20 text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-md px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{hasExisting ? "이력서 수정" : "이력서 등록"}</h1>
        {hasExisting && (
          <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
            {deleting ? "삭제 중..." : "이력서 삭제"}
          </Button>
        )}
      </div>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
        {success && <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">{success}</div>}

        <Card>
          <CardHeader><CardTitle className="text-lg">기본 정보</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="nickname">닉네임 *</Label>
              <input id="nickname" value={form.nickname} onChange={(e) => updateField("nickname", e.target.value)}
                className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" required />
            </div>
            <div>
              <Label htmlFor="age">나이</Label>
              <input id="age" type="number" value={form.age} onChange={(e) => updateField("age", e.target.value)}
                className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <Label>희망 지역 *</Label>
              <select value={form.region} onChange={(e) => updateField("region", e.target.value)}
                className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" required>
                <option value="">선택</option>
                {REGION_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="district">상세 지역</Label>
              <input id="district" value={form.district} onChange={(e) => updateField("district", e.target.value)}
                placeholder="예: 강남구, 홍대 등" className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">희망 업종</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {JOB_OPTIONS.map((j) => (
                <button key={j.value} type="button" onClick={() => toggleJob(j.value)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    form.desiredJobs.includes(j.value) ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"
                  }`}>
                  {j.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">경력 및 소개</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="experience">경력</Label>
              <input id="experience" value={form.experience} onChange={(e) => updateField("experience", e.target.value)}
                placeholder="예: 룸싸롱 1년, 바 6개월" className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <Label htmlFor="introduction">자기소개</Label>
              <textarea id="introduction" value={form.introduction} onChange={(e) => updateField("introduction", e.target.value)}
                rows={4} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium">이력서 공개</p>
              <p className="text-xs text-muted-foreground">비공개 시 업소에서 열람할 수 없습니다</p>
            </div>
            <button type="button" onClick={() => updateField("isPublic", !form.isPublic)}
              className={`relative h-6 w-11 rounded-full transition-colors ${form.isPublic ? "bg-primary" : "bg-muted"}`}>
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.isPublic ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </CardContent>
        </Card>

        <Button type="submit" className="h-12 w-full text-base" disabled={saving}>
          {saving ? "저장 중..." : hasExisting ? "이력서 수정" : "이력서 등록"}
        </Button>
      </form>
    </div>
  );
}
