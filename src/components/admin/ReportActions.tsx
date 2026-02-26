"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ReportActionsProps {
  reportId: string;
  postId?: string | null;
  commentId?: string | null;
}

export function ReportActions({ reportId, postId, commentId }: ReportActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState("");

  const updateStatus = async (status: "RESOLVED" | "DISMISSED") => {
    setLoading(status);
    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        alert("처리에 실패했습니다");
      }
    } catch {
      alert("오류가 발생했습니다");
    } finally {
      setLoading("");
    }
  };

  const handleHideAndResolve = async () => {
    if (!confirm("해당 콘텐츠를 숨김 처리하고 신고를 완료할까요?")) return;
    setLoading("HIDE");

    try {
      // 게시글 숨김 처리
      if (postId) {
        await fetch(`/api/admin/posts/${postId}/hide`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isHidden: true }),
        });
      }

      // 댓글은 삭제 처리
      if (commentId) {
        // commentId에서 postId를 알아내기 위해 report의 comment 정보 사용
        await fetch(`/api/reports/${reportId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "RESOLVED" }),
        });
        router.refresh();
        return;
      }

      // 신고 상태 업데이트
      await fetch(`/api/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "RESOLVED" }),
      });

      router.refresh();
    } catch {
      alert("처리 중 오류가 발생했습니다");
    } finally {
      setLoading("");
    }
  };

  return (
    <div className="flex shrink-0 flex-col gap-1">
      {postId && (
        <Button
          size="sm"
          variant="outline"
          className="text-xs"
          onClick={handleHideAndResolve}
          disabled={!!loading}
        >
          {loading === "HIDE" ? "..." : "숨김+처리"}
        </Button>
      )}
      <Button
        size="sm"
        variant="outline"
        className="text-xs"
        onClick={() => updateStatus("RESOLVED")}
        disabled={!!loading}
      >
        {loading === "RESOLVED" ? "..." : "처리완료"}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="text-xs text-muted-foreground"
        onClick={() => updateStatus("DISMISSED")}
        disabled={!!loading}
      >
        {loading === "DISMISSED" ? "..." : "반려"}
      </Button>
    </div>
  );
}
