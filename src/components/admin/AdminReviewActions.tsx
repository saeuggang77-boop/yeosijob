"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Trash2, Pencil, X, Check } from "lucide-react";
import { toast } from "sonner";

interface Props {
  reviewId: string;
  isHidden: boolean;
  content: string;
  rating: number;
}

export function AdminReviewActions({ reviewId, isHidden, content, rating }: Props) {
  const [hidden, setHidden] = useState(isHidden);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [editRating, setEditRating] = useState(rating);
  const [deleted, setDeleted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleToggleHidden() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isHidden: !hidden }),
      });
      if (res.ok) {
        setHidden(!hidden);
        toast.success(hidden ? "리뷰가 공개되었습니다" : "리뷰가 숨김처리되었습니다");
      } else {
        const data = await res.json();
        toast.error(data.error || "처리에 실패했습니다");
      }
    } catch {
      toast.error("서버 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveEdit() {
    if (!editContent.trim()) {
      toast.error("내용을 입력해주세요");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent, rating: editRating }),
      });
      if (res.ok) {
        toast.success("리뷰가 수정되었습니다");
        setEditing(false);
      } else {
        const data = await res.json();
        toast.error(data.error || "수정에 실패했습니다");
      }
    } catch {
      toast.error("서버 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("이 리뷰를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleted(true);
        toast.success("리뷰가 삭제되었습니다");
      } else {
        const data = await res.json();
        toast.error(data.error || "삭제에 실패했습니다");
      }
    } catch {
      toast.error("서버 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }

  if (deleted) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="destructive">삭제됨</Badge>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* 상태 배지 */}
      <Badge variant={hidden ? "secondary" : "default"}>
        {hidden ? "숨김" : "공개"}
      </Badge>

      {/* 수정 폼 */}
      {editing && (
        <div className="space-y-2 mt-2">
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">평점:</span>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setEditRating(star)}
                className={`text-sm ${star <= editRating ? "text-yellow-400" : "text-gray-500"}`}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={3}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="flex gap-1">
            <Button size="sm" variant="default" onClick={handleSaveEdit} disabled={loading}>
              <Check className="h-3.5 w-3.5 mr-1" />저장
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setEditContent(content); setEditRating(rating); }}>
              <X className="h-3.5 w-3.5 mr-1" />취소
            </Button>
          </div>
        </div>
      )}

      {/* 액션 버튼 */}
      {!editing && (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={handleToggleHidden} disabled={loading} title={hidden ? "공개" : "숨김"}>
            {hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(true)} disabled={loading} title="수정">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="ghost" onClick={handleDelete} disabled={loading} title="삭제" className="text-destructive hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
