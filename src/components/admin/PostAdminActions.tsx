"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface PostAdminActionsProps {
  postId: string;
  isHidden: boolean;
}

export function PostAdminActions({ postId, isHidden }: PostAdminActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleHidden = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const res = await fetch(`/api/admin/posts/${postId}/hide`, {
        method: "PATCH",
      });

      if (!res.ok) throw new Error("Failed to update post");
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
      const res = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete post");
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
      <Button
        variant="outline"
        size="sm"
        onClick={handleToggleHidden}
        disabled={isLoading}
      >
        {isHidden ? "공개" : "숨기기"}
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
