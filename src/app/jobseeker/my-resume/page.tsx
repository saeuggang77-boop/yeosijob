"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DISTRICTS } from "@/lib/constants/districts";
import { EXPERIENCE_LEVELS, SALARY_TYPES, GENDER_OPTIONS } from "@/lib/constants/resume";
import { REGION_LIST } from "@/lib/constants/regions";
import { BUSINESS_TYPE_LIST } from "@/lib/constants/business-types";

type Mode = "view" | "form";

interface ResumeData {
  id: string;
  nickname: string;
  gender: string;
  age: number;
  height?: number;
  weight?: number;
  region: string;
  districts: string[];
  desiredJobs: string[];
  experienceLevel: string;
  desiredSalaryType?: string;
  desiredSalaryAmount?: number;
  availableHours?: string;
  kakaoId: string;
  phone?: string;
  title: string;
  introduction: string;
  photoUrl?: string;
  isPublic: boolean;
  canBumpToday?: boolean;
}

export default function MyResumePage() {
  const [mode, setMode] = useState<Mode>("form");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [bumping, setBumping] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [generatingIntro, setGeneratingIntro] = useState(false);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");

  const [form, setForm] = useState({
    nickname: "",
    gender: "여성",
    age: "",
    height: "",
    weight: "",
    region: "",
    districts: [] as string[],
    desiredJobs: [] as string[],
    experienceLevel: "",
    desiredSalaryType: "",
    desiredSalaryAmount: "",
    availableHours: "",
    kakaoId: "",
    phone: "",
    title: "",
    introduction: "",
    photoUrl: "",
    isPublic: true,
  });

  async function fetchResume() {
    try {
      const res = await fetch("/api/resumes/mine");
      if (res.ok) {
        const data = await res.json();
        if (data.resume) {
          setResumeData(data.resume);
          setMode("view");
        } else {
          setResumeData(null);
          setMode("form");
        }
      }
    } catch {
      // Silently fail
    }
  }

  useEffect(() => {
    fetchResume().finally(() => setLoading(false));
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

  function addDistrict() {
    if (!selectedRegion || !selectedDistrict) return;
    if (form.districts.length >= 3) {
      toast.error("최대 3개까지 선택 가능합니다");
      return;
    }
    const combined = `${REGION_LIST.find((r) => r.value === selectedRegion)?.label} ${selectedDistrict}`;
    if (form.districts.includes(combined)) {
      toast.error("이미 추가된 지역입니다");
      return;
    }
    setForm((prev) => ({ ...prev, districts: [...prev.districts, combined] }));
    setSelectedDistrict("");
  }

  function removeDistrict(district: string) {
    setForm((prev) => ({ ...prev, districts: prev.districts.filter((d) => d !== district) }));
  }

  async function uploadFile(file: File) {
    const validTypes = ["image/jpeg", "image/png"];
    if (!validTypes.includes(file.type)) {
      toast.error("JPG, PNG 파일만 업로드 가능합니다");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("5MB 이하 이미지만 업로드 가능합니다");
      return;
    }

    setUploadingPhoto(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "업로드 실패");
        return;
      }
      setForm((prev) => ({ ...prev, photoUrl: data.url }));
      setPhotoPreview(data.url);
      toast.success("사진이 업로드되었습니다");
    } catch {
      toast.error("업로드 중 오류가 발생했습니다");
    } finally {
      setUploadingPhoto(false);
    }
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  function handleDeletePhoto() {
    setForm((prev) => ({ ...prev, photoUrl: "" }));
    setPhotoPreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function generateIntro() {
    if (!form.nickname || !form.age) {
      toast.error("닉네임과 나이를 먼저 입력해주세요");
      return;
    }
    setGeneratingIntro(true);
    try {
      const res = await fetch("/api/resumes/generate-intro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: form.nickname,
          age: parseInt(form.age) || 0,
          experienceLevel: form.experienceLevel,
          desiredJobs: form.desiredJobs,
          region: form.region,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "자동완성 실패");
        return;
      }
      updateField("introduction", data.introduction);
      toast.success("자기소개가 생성되었습니다. 수정 후 저장해주세요.");
    } catch {
      toast.error("자동완성 중 오류가 발생했습니다");
    } finally {
      setGeneratingIntro(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setSaving(true);

    const payload = {
      nickname: form.nickname,
      gender: form.gender,
      age: parseInt(form.age) || 0,
      height: form.height ? parseInt(form.height) : undefined,
      weight: form.weight ? parseInt(form.weight) : undefined,
      region: form.region,
      districts: form.districts,
      desiredJobs: form.desiredJobs,
      experienceLevel: form.experienceLevel,
      desiredSalaryType: form.desiredSalaryType || undefined,
      desiredSalaryAmount: form.desiredSalaryAmount ? parseInt(form.desiredSalaryAmount) : undefined,
      availableHours: form.availableHours || undefined,
      kakaoId: form.kakaoId,
      phone: form.phone || undefined,
      title: form.title,
      introduction: form.introduction,
      photoUrl: form.photoUrl || undefined,
      isPublic: form.isPublic,
    };

    try {
      const res = await fetch("/api/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        if (data.fieldErrors) setFieldErrors(data.fieldErrors);
        return;
      }
      toast.success(resumeData ? "이력서가 수정되었습니다" : "이력서가 등록되었습니다");
      await fetchResume();
    } catch {
      setError("서버 오류가 발생했습니다");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("이력서를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) return;
    setError("");
    setDeleting(true);
    try {
      const res = await fetch("/api/resumes/mine", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      toast.success("이력서가 삭제되었습니다");
      setResumeData(null);
      setMode("form");
      setForm({
        nickname: "",
        gender: "여성",
        age: "",
        height: "",
        weight: "",
        region: "",
        districts: [],
        desiredJobs: [],
        experienceLevel: "",
        desiredSalaryType: "",
        desiredSalaryAmount: "",
        availableHours: "",
        kakaoId: "",
        phone: "",
        title: "",
        introduction: "",
        photoUrl: "",
        isPublic: true,
      });
      setPhotoPreview("");
    } catch {
      setError("서버 오류가 발생했습니다");
    } finally {
      setDeleting(false);
    }
  }

  async function handleBump() {
    setBumping(true);
    try {
      const res = await fetch("/api/resumes/bump", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "끌어올리기 실패");
        return;
      }
      toast.success("이력서가 끌어올려졌습니다");
      await fetchResume();
    } catch {
      toast.error("끌어올리기 중 오류가 발생했습니다");
    } finally {
      setBumping(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/resumes/refresh", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "갱신 실패");
        return;
      }
      toast.success("이력서가 갱신되었습니다");
      await fetchResume();
    } catch {
      toast.error("갱신 중 오류가 발생했습니다");
    } finally {
      setRefreshing(false);
    }
  }

  function handleEdit() {
    if (!resumeData) return;
    setForm({
      nickname: resumeData.nickname || "",
      gender: resumeData.gender || "여성",
      age: resumeData.age?.toString() || "",
      height: resumeData.height?.toString() || "",
      weight: resumeData.weight?.toString() || "",
      region: resumeData.region || "",
      districts: resumeData.districts || [],
      desiredJobs: resumeData.desiredJobs || [],
      experienceLevel: resumeData.experienceLevel || "",
      desiredSalaryType: resumeData.desiredSalaryType || "",
      desiredSalaryAmount: resumeData.desiredSalaryAmount?.toString() || "",
      availableHours: resumeData.availableHours || "",
      kakaoId: resumeData.kakaoId || "",
      phone: resumeData.phone || "",
      title: resumeData.title || "",
      introduction: resumeData.introduction || "",
      photoUrl: resumeData.photoUrl || "",
      isPublic: resumeData.isPublic !== false,
    });
    if (resumeData.photoUrl) {
      setPhotoPreview(resumeData.photoUrl);
    }
    setMode("form");
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-screen-md px-4 py-20 text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  function FieldError({ field }: { field: string }) {
    const errors = fieldErrors[field];
    if (!errors || errors.length === 0) return null;
    return <p className="mt-1 text-xs text-red-500">{errors[0]}</p>;
  }

  const availableDistricts = selectedRegion ? DISTRICTS[selectedRegion as keyof typeof DISTRICTS] || [] : [];

  // View Mode - Detail View
  if (mode === "view" && resumeData) {
    const experienceLabel = EXPERIENCE_LEVELS.find((e) => e.value === resumeData.experienceLevel)?.label || resumeData.experienceLevel;
    const salaryTypeLabel = SALARY_TYPES.find((s) => s.value === resumeData.desiredSalaryType)?.label;
    const jobLabels = resumeData.desiredJobs.map((job) => BUSINESS_TYPE_LIST.find((b) => b.value === job)?.label || job);

    return (
      <div className="mx-auto max-w-screen-md px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">나의 이력서</h1>
        </div>

        {error && <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        {/* Main Card - Photo + Title + Expiry */}
        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              {resumeData.photoUrl && (
                <img
                  src={resumeData.photoUrl}
                  alt="프로필 사진"
                  className="h-32 w-32 rounded-full object-cover border-2 border-muted shadow-sm"
                />
              )}
              <div className="text-center">
                <h2 className="text-xl font-bold">{resumeData.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {resumeData.nickname} · {resumeData.age}세 · {resumeData.gender}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBump}
                  disabled={!resumeData.canBumpToday || bumping}
                >
                  {bumping ? "처리 중..." : "끌어올리기"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  {refreshing ? "처리 중..." : "갱신하기"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                >
                  수정하기
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? "삭제 중..." : "삭제"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">기본정보</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              키: {resumeData.height ? `${resumeData.height}cm` : "-"} / 몸무게: {resumeData.weight ? `${resumeData.weight}kg` : "-"}
            </p>
          </CardContent>
        </Card>

        {/* Desired Regions */}
        {resumeData.districts && resumeData.districts.length > 0 && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-base">희망 근무지역</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{resumeData.districts.join(", ")}</p>
            </CardContent>
          </Card>
        )}

        {/* Desired Jobs */}
        {resumeData.desiredJobs && resumeData.desiredJobs.length > 0 && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-base">희망 업종</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {jobLabels.map((label, idx) => (
                  <Badge key={idx} variant="secondary">{label}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Experience */}
        {resumeData.experienceLevel && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-base">경력</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{experienceLabel}</p>
            </CardContent>
          </Card>
        )}

        {/* Desired Salary */}
        {resumeData.desiredSalaryType && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-base">희망 급여</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                {salaryTypeLabel}
                {resumeData.desiredSalaryAmount && resumeData.desiredSalaryType !== "NEGOTIABLE" && (
                  <> {resumeData.desiredSalaryAmount.toLocaleString()}원</>
                )}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Available Hours */}
        {resumeData.availableHours && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-base">근무 가능 시간</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{resumeData.availableHours}</p>
            </CardContent>
          </Card>
        )}

        {/* Contact */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">연락처</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-sm">카카오: {resumeData.kakaoId}</p>
            {resumeData.phone && <p className="text-sm">전화: {resumeData.phone}</p>}
          </CardContent>
        </Card>

        {/* Introduction */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">자기소개</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{resumeData.introduction}</p>
          </CardContent>
        </Card>

        {/* Public Status */}
        <Card className={`transition-colors ${resumeData.isPublic ? "border-green-200 bg-green-50/50" : "border-gray-200 bg-gray-50/50"}`}>
          <CardContent className="flex items-center gap-3 py-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${resumeData.isPublic ? "bg-green-100 text-green-600" : "bg-gray-200 text-gray-500"}`}>
              {resumeData.isPublic ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              )}
            </div>
            <div>
              <p className={`text-sm font-semibold transition-colors ${resumeData.isPublic ? "text-green-700" : "text-gray-600"}`}>
                {resumeData.isPublic ? "공개 중" : "비공개"}
              </p>
              <p className={`text-xs transition-colors ${resumeData.isPublic ? "text-green-600/70" : "text-gray-500"}`}>
                {resumeData.isPublic ? "사장님들이 내 이력서를 볼 수 있어요" : "아무도 내 이력서를 볼 수 없어요"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Form Mode
  return (
    <div className="mx-auto max-w-screen-md px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">나의 이력서</h1>
      </div>

      {/* Privacy notice */}
      <div className="mb-4 flex items-start gap-3 rounded-lg border border-green-500/20 bg-green-500/5 p-4">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-500/10 text-green-500">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-green-400">안심하고 등록하세요</p>
          <p className="mt-1 text-xs text-muted-foreground">
            연락처, 사진 등 상세정보는 <strong className="text-foreground">유료 광고를 등록한 인증 사장님만</strong> 열람할 수 있습니다. 목록에는 닉네임, 지역, 희망업종 등 기본정보만 공개됩니다.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        {/* Card 1: 기본정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">기본정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="nickname">닉네임 *</Label>
              <input
                id="nickname"
                value={form.nickname}
                onChange={(e) => updateField("nickname", e.target.value)}
                className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                required
              />
              <FieldError field="nickname" />
            </div>
            <div>
              <Label>성별 *</Label>
              <div className="mt-2 flex gap-4">
                {GENDER_OPTIONS.map((g) => (
                  <label key={g.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value={g.value}
                      checked={form.gender === g.value}
                      onChange={(e) => updateField("gender", e.target.value)}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">{g.label}</span>
                  </label>
                ))}
              </div>
              <FieldError field="gender" />
            </div>
            <div>
              <Label htmlFor="age">나이 *</Label>
              <input
                id="age"
                type="number"
                value={form.age}
                onChange={(e) => updateField("age", e.target.value)}
                className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                required
              />
              <FieldError field="age" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="height">키 (cm)</Label>
                <input
                  id="height"
                  type="number"
                  value={form.height}
                  onChange={(e) => updateField("height", e.target.value)}
                  className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <Label htmlFor="weight">몸무게 (kg)</Label>
                <input
                  id="weight"
                  type="number"
                  value={form.weight}
                  onChange={(e) => updateField("weight", e.target.value)}
                  className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: 희망 근무지역 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">희망 근무지역 (최대 3개)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="시/도 선택" />
                </SelectTrigger>
                <SelectContent>
                  {REGION_LIST.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedDistrict} onValueChange={setSelectedDistrict} disabled={!selectedRegion}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="구/군 선택" />
                </SelectTrigger>
                <SelectContent>
                  {availableDistricts.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                onClick={addDistrict}
                disabled={!selectedRegion || !selectedDistrict || form.districts.length >= 3}
              >
                추가
              </Button>
            </div>
            {form.districts.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.districts.map((d) => (
                  <Badge key={d} variant="secondary" className="cursor-pointer" onClick={() => removeDistrict(d)}>
                    {d} ×
                  </Badge>
                ))}
              </div>
            )}
            <FieldError field="region" />
            <FieldError field="districts" />
          </CardContent>
        </Card>

        {/* Card 3: 희망 업종 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">희망 업종</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {BUSINESS_TYPE_LIST.map((j) => (
                <Button
                  key={j.value}
                  type="button"
                  variant={form.desiredJobs.includes(j.value) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleJob(j.value)}
                >
                  {j.label}
                </Button>
              ))}
            </div>
            <FieldError field="desiredJobs" />
          </CardContent>
        </Card>

        {/* Card 4: 경력 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">경력</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={form.experienceLevel} onValueChange={(v) => updateField("experienceLevel", v)}>
              <SelectTrigger>
                <SelectValue placeholder="경력 선택" />
              </SelectTrigger>
              <SelectContent>
                {EXPERIENCE_LEVELS.map((e) => (
                  <SelectItem key={e.value} value={e.value}>
                    {e.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError field="experienceLevel" />
          </CardContent>
        </Card>

        {/* Card 5: 희망 급여 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">희망 급여</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>유형</Label>
              <Select value={form.desiredSalaryType} onValueChange={(v) => updateField("desiredSalaryType", v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="급여 유형 선택" />
                </SelectTrigger>
                <SelectContent>
                  {SALARY_TYPES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="salaryAmount">금액 (원)</Label>
              <input
                id="salaryAmount"
                type="number"
                value={form.desiredSalaryAmount}
                onChange={(e) => updateField("desiredSalaryAmount", e.target.value)}
                disabled={form.desiredSalaryType === "NEGOTIABLE"}
                className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              />
            </div>
          </CardContent>
        </Card>

        {/* Card 6: 근무 가능 시간 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">근무 가능 시간</CardTitle>
          </CardHeader>
          <CardContent>
            <input
              value={form.availableHours}
              onChange={(e) => updateField("availableHours", e.target.value)}
              placeholder="예: 평일 오후 6시~새벽 2시"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </CardContent>
        </Card>

        {/* Card 7: 연락처 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">연락처</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="kakaoId">카카오톡 ID *</Label>
              <input
                id="kakaoId"
                value={form.kakaoId}
                onChange={(e) => updateField("kakaoId", e.target.value)}
                className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                required
              />
              <FieldError field="kakaoId" />
            </div>
            <div>
              <Label htmlFor="phone">전화번호 (선택)</Label>
              <input
                id="phone"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="010-1234-5678"
                className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <FieldError field="phone" />
            </div>
          </CardContent>
        </Card>

        {/* Card 8: 이력서 내용 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">이력서 내용</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">제목 (30자 이내) *</Label>
              <input
                id="title"
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                maxLength={30}
                className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                required
              />
              <p className="mt-1 text-xs text-muted-foreground">{form.title.length}/30</p>
              <FieldError field="title" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="introduction">자기소개 (500자 이내) *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateIntro}
                  disabled={generatingIntro}
                  className="text-xs"
                >
                  {generatingIntro ? "생성 중..." : "AI 자동완성"}
                </Button>
              </div>
              <textarea
                id="introduction"
                value={form.introduction}
                onChange={(e) => updateField("introduction", e.target.value)}
                maxLength={500}
                rows={5}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                required
              />
              <p className="mt-1 text-xs text-muted-foreground">{form.introduction.length}/500</p>
              <FieldError field="introduction" />
            </div>
          </CardContent>
        </Card>

        {/* Card 9: 사진 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">사진</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              onChange={handlePhotoUpload}
              disabled={uploadingPhoto}
              className="hidden"
            />

            {photoPreview ? (
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <img
                    src={photoPreview}
                    alt="프로필 사진"
                    className="h-48 w-48 rounded-xl object-cover border-2 border-muted shadow-sm"
                  />
                  {uploadingPhoto && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40">
                      <div className="h-8 w-8 animate-spin rounded-full border-3 border-white border-t-transparent" />
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                  >
                    <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                    </svg>
                    사진 변경
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDeletePhoto}
                    disabled={uploadingPhoto}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    삭제
                  </Button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => !uploadingPhoto && fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 transition-colors ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
                }`}
              >
                {uploadingPhoto ? (
                  <div className="h-10 w-10 animate-spin rounded-full border-3 border-primary border-t-transparent" />
                ) : (
                  <>
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                      <svg className="h-10 w-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                    </div>
                    <Button type="button" variant="outline" size="sm" className="pointer-events-none">
                      <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                      </svg>
                      사진 등록하기
                    </Button>
                    <p className="text-xs text-muted-foreground">여기에 사진을 끌어다 놓거나 클릭하세요</p>
                  </>
                )}
              </div>
            )}

            <p className="text-center text-xs text-muted-foreground">
              JPG, PNG / 최대 5MB
            </p>
            <p className="text-center text-xs text-muted-foreground/70">
              얼굴이 나오지 않는 사진도 괜찮습니다. 신분증 사진은 업로드하지 마세요.
            </p>
          </CardContent>
        </Card>

        {/* Card 10: 공개설정 */}
        <Card className={`transition-colors ${form.isPublic ? "border-green-200 bg-green-50/50" : "border-gray-200 bg-gray-50/50"}`}>
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${form.isPublic ? "bg-green-100 text-green-600" : "bg-gray-200 text-gray-500"}`}>
                {form.isPublic ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                )}
              </div>
              <div>
                <p className={`text-sm font-semibold transition-colors ${form.isPublic ? "text-green-700" : "text-gray-600"}`}>
                  {form.isPublic ? "공개 중" : "비공개"}
                </p>
                <p className={`text-xs transition-colors ${form.isPublic ? "text-green-600/70" : "text-gray-500"}`}>
                  {form.isPublic ? "사장님들이 내 이력서를 볼 수 있어요" : "아무도 내 이력서를 볼 수 없어요"}
                </p>
              </div>
            </div>
            <Switch checked={form.isPublic} onCheckedChange={(v) => updateField("isPublic", v)} />
          </CardContent>
        </Card>

        <Button type="submit" className="h-12 w-full text-base" disabled={saving}>
          {saving ? "저장 중..." : resumeData ? "이력서 수정" : "이력서 등록"}
        </Button>
      </form>
    </div>
  );
}
