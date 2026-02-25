"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import {
  Loader2,
  ArrowLeft,
  Upload,
  Download,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Trash2,
  CheckSquare,
  Square,
} from "lucide-react";

const PAGE_SIZE = 50;

interface KeywordManagerProps {
  initialKeywords: string[];
}

export function KeywordManager({ initialKeywords }: KeywordManagerProps) {
  const [keywords, setKeywords] = useState<string[]>(initialKeywords);
  const [keywordInput, setKeywordInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);

  // 필터링된 키워드
  const filtered = searchQuery
    ? keywords.filter((k) => k.includes(searchQuery))
    : keywords;

  // 페이지네이션
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageKeywords = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  // 현재 페이지 전체 선택 여부
  const allPageSelected =
    pageKeywords.length > 0 && pageKeywords.every((k) => selected.has(k));

  // --- 서버 저장 ---
  const saveKeywords = async (newKeywords: string[]) => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/auto-content/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seoKeywords: newKeywords }),
      });
      if (!res.ok) throw new Error("저장 실패");
      setKeywords(newKeywords);
    } catch {
      toast.error("키워드 저장에 실패했습니다");
      throw new Error("save failed");
    } finally {
      setSaving(false);
    }
  };

  // --- 키워드 추가 ---
  const handleAddKeyword = async () => {
    const keyword = keywordInput.trim();
    if (!keyword) return;
    if (keywords.includes(keyword)) {
      toast.error("이미 등록된 키워드입니다");
      return;
    }
    try {
      await saveKeywords([...keywords, keyword]);
      setKeywordInput("");
      toast.success("키워드가 추가되었습니다");
    } catch {
      // saveKeywords에서 에러 처리됨
    }
  };

  // --- 일괄 추가 (중복 제거) ---
  const addKeywords = async (newList: string[]) => {
    const cleaned = newList
      .map((k) => k.trim())
      .filter((k) => k.length > 0 && !keywords.includes(k));
    const unique = [...new Set(cleaned)];

    if (unique.length === 0) {
      toast.error("추가할 새 키워드가 없습니다");
      return;
    }

    try {
      await saveKeywords([...keywords, ...unique]);
      toast.success(`${unique.length}개 키워드가 추가되었습니다`);
    } catch {
      // saveKeywords에서 에러 처리됨
    }
  };

  // --- AI 키워드 추출 ---
  const extractAndAddKeywords = async (texts: string[]) => {
    const cleaned = texts.map((t) => t.trim()).filter((t) => t.length > 0);
    if (cleaned.length === 0) {
      toast.error("추출할 텍스트가 없습니다");
      return;
    }

    setExtracting(true);
    try {
      const res = await fetch("/api/admin/auto-content/extract-keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts: cleaned }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await addKeywords(data.keywords);
    } catch (err) {
      toast.error(
        `키워드 추출 실패: ${err instanceof Error ? err.message : "알 수 없는 오류"}`
      );
    } finally {
      setExtracting(false);
    }
  };

  // --- 파일 업로드 ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();

    if (ext === "xlsx" || ext === "xls") {
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: string[][] = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
        });
        const texts = rows.flat().map(String);
        extractAndAddKeywords(texts);
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (!text) return;
        const texts = text.split(/[\n\r,\t]+/);
        extractAndAddKeywords(texts);
      };
      reader.readAsText(file);
    }
    e.target.value = "";
  };

  // --- 다운로드 ---
  const handleDownload = () => {
    const blob = new Blob([keywords.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "seo-keywords.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- 선택/삭제 ---
  const toggleSelect = (keyword: string) => {
    const next = new Set(selected);
    if (next.has(keyword)) next.delete(keyword);
    else next.add(keyword);
    setSelected(next);
  };

  const togglePageAll = () => {
    const next = new Set(selected);
    if (allPageSelected) {
      pageKeywords.forEach((k) => next.delete(k));
    } else {
      pageKeywords.forEach((k) => next.add(k));
    }
    setSelected(next);
  };

  const handleDeleteSelected = async () => {
    if (selected.size === 0) return;
    const remaining = keywords.filter((k) => !selected.has(k));
    try {
      await saveKeywords(remaining);
      setSelected(new Set());
      toast.success(`${keywords.length - remaining.length}개 키워드가 삭제되었습니다`);
    } catch {
      // saveKeywords에서 에러 처리됨
    }
  };

  const handleDeleteSingle = async (keyword: string) => {
    const remaining = keywords.filter((k) => k !== keyword);
    try {
      await saveKeywords(remaining);
      const next = new Set(selected);
      next.delete(keyword);
      setSelected(next);
    } catch {
      // saveKeywords에서 에러 처리됨
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <Link href="/admin/auto-content">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 size-4" />
            돌아가기
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">SEO 키워드 관리</h1>
          <p className="text-sm text-muted-foreground">
            총 {keywords.length}개 등록됨
          </p>
        </div>
      </div>

      {/* 키워드 추가 */}
      <Card className="border-zinc-700 bg-zinc-800">
        <CardHeader>
          <CardTitle className="text-[#D4A853]">키워드 추가</CardTitle>
          <CardDescription>
            직접 입력하거나 파일(xlsx/txt/csv)을 업로드하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Input
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddKeyword();
                }
              }}
              placeholder="키워드 입력 후 Enter"
              className="min-w-[200px] flex-1 bg-zinc-900 border-zinc-700"
              disabled={saving}
            />
            <Button
              onClick={handleAddKeyword}
              variant="outline"
              disabled={saving}
            >
              추가
            </Button>
            <Button
              variant="outline"
              disabled={extracting}
              onClick={() =>
                document.getElementById("keyword-file-input")?.click()
              }
            >
              {extracting ? (
                <>
                  <Loader2 className="mr-1 size-4 animate-spin" />
                  추출 중...
                </>
              ) : (
                <>
                  <Upload className="mr-1 size-4" />
                  파일 업로드
                </>
              )}
            </Button>
            {keywords.length > 0 && (
              <Button variant="outline" onClick={handleDownload}>
                <Download className="mr-1 size-4" />
                다운로드
              </Button>
            )}
            <input
              id="keyword-file-input"
              type="file"
              accept=".txt,.csv,.xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      {/* 키워드 목록 */}
      <Card className="border-zinc-700 bg-zinc-800">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-[#D4A853]">키워드 목록</CardTitle>
              <CardDescription>
                {searchQuery
                  ? `"${searchQuery}" 검색 결과: ${filtered.length}개`
                  : `총 ${keywords.length}개`}
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="키워드 검색..."
                className="bg-zinc-900 border-zinc-700 pl-9"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setCurrentPage(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* 선택 도구 */}
          {pageKeywords.length > 0 && (
            <div className="mb-4 flex items-center gap-3">
              <button
                onClick={togglePageAll}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white transition-colors"
              >
                {allPageSelected ? (
                  <CheckSquare className="size-4 text-[#D4A853]" />
                ) : (
                  <Square className="size-4" />
                )}
                전체 선택
              </button>
              {selected.size > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteSelected}
                  disabled={saving}
                >
                  <Trash2 className="mr-1 size-3.5" />
                  {selected.size}개 삭제
                </Button>
              )}
              {saving && (
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              )}
            </div>
          )}

          {/* 키워드 리스트 */}
          {pageKeywords.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {searchQuery
                ? "검색 결과가 없습니다"
                : "등록된 키워드가 없습니다"}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {pageKeywords.map((keyword) => (
                <Badge
                  key={keyword}
                  variant="secondary"
                  className={`cursor-pointer select-none transition-colors ${
                    selected.has(keyword)
                      ? "bg-[#D4A853]/20 border border-[#D4A853]/50 text-[#D4A853]"
                      : "text-zinc-300 hover:text-[#D4A853]"
                  }`}
                  onClick={() => toggleSelect(keyword)}
                >
                  {keyword}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSingle(keyword);
                    }}
                    className="ml-1.5 hover:text-red-500"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="sm"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage(safePage - 1)}
              >
                <ChevronLeft className="size-4" />
                이전
              </Button>
              <span className="text-sm text-muted-foreground">
                {safePage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage(safePage + 1)}
              >
                다음
                <ChevronRight className="size-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
