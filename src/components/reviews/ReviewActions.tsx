"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, X } from "lucide-react";

interface ReviewActionsProps {
  reviewId: string;
  currentRating: number;
  currentContent: string;
}

export function ReviewActions({ reviewId, currentRating, currentContent }: ReviewActionsProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [rating, setRating] = useState(currentRating);
  const [content, setContent] = useState(currentContent);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (!confirm("이 후기를 삭제하시겠습니까?")) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "삭제 실패");
      }
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "후기 삭제에 실패했습니다.");
      setIsDeleting(false);
    }
  };

  const handleSave = async () => {
    setError("");
    if (rating < 1) { setError("별점을 선택해주세요"); return; }
    if (content.length < 10) { setError("후기는 최소 10자 이상 입력해주세요"); return; }
    if (content.length > 500) { setError("후기는 최대 500자까지 입력 가능합니다"); return; }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, content }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "수정 실패");
      }
      setIsEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "후기 수정에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing) {
    return (
      <div className="mt-2 space-y-3 rounded-md border p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">후기 수정</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setIsEditing(false); setRating(currentRating); setContent(currentContent); setError(""); }}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button key={star} type="button" onClick={() => setRating(star)} className="text-2xl">
              {star <= rating ? <span className="text-yellow-400">★</span> : <span className="text-gray-300">☆</span>}
            </button>
          ))}
        </div>
        <Textarea value={content} onChange={(e) => setContent(e.target.value)} className="min-h-[80px]" maxLength={500} />
        <div className="text-xs text-muted-foreground">{content.length}/500</div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "저장 중..." : "저장"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => { setIsEditing(false); setRating(currentRating); setContent(currentContent); setError(""); }}>
            취소
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2 flex gap-2">
      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setIsEditing(true)}>
        <Pencil className="mr-1 h-3 w-3" />
        수정
      </Button>
      <Button variant="outline" size="sm" className="h-7 text-xs text-destructive hover:text-destructive" onClick={handleDelete} disabled={isDeleting}>
        <Trash2 className="mr-1 h-3 w-3" />
        {isDeleting ? "삭제 중..." : "삭제"}
      </Button>
    </div>
  );
}
