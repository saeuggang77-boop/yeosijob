"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface NoticeAdminActionsProps {
  noticeId: string;
  isPinned: boolean;
}

export function NoticeAdminActions({ noticeId, isPinned }: NoticeAdminActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleTogglePinned = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const res = await fetch(`/api/notices/${noticeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: !isPinned }),
      });

      if (!res.ok) throw new Error("Failed to update notice");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("상태 변경에 실패했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (isLoading) return;
    if (!confirm("정말 삭제하시겠습니까?")) return;

    setIsLoading(true);

    try {
      const res = await fetch(`/api/notices/${noticeId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete notice");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("삭제에 실패했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Link href={`/admin/notices/${noticeId}/edit`}>
        <Button variant="outline" size="sm">
          수정
        </Button>
      </Link>
      <Button
        variant="outline"
        size="sm"
        onClick={handleTogglePinned}
        disabled={isLoading}
      >
        {isPinned ? "고정 해제" : "고정"}
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={handleDelete}
        disabled={isLoading}
      >
        삭제
      </Button>
    </div>
  );
}
