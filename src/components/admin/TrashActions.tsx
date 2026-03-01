"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface TrashActionsProps {
  type: "post" | "comment";
  id: string;
}

export function TrashActions({ type, id }: TrashActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleRestore = async () => {
    if (!confirm(`이 ${type === "post" ? "게시글" : "댓글"}을 복구하시겠습니까?`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/trash", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "복구 실패");
      }

      alert("복구되었습니다");
      router.refresh();
    } catch (error: any) {
      alert(error.message || "복구 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  const handlePermanentDelete = async () => {
    if (
      !confirm(
        `이 ${type === "post" ? "게시글" : "댓글"}을 영구 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/trash", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "삭제 실패");
      }

      alert("영구 삭제되었습니다");
      router.refresh();
    } catch (error: any) {
      alert(error.message || "삭제 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={handleRestore}
        disabled={loading}
        className="text-xs"
      >
        복구
      </Button>
      <Button
        size="sm"
        variant="destructive"
        onClick={handlePermanentDelete}
        disabled={loading}
        className="text-xs"
      >
        영구삭제
      </Button>
    </div>
  );
}
