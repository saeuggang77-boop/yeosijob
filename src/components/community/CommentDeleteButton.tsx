"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface CommentDeleteButtonProps {
  postId: string;
  commentId: string;
}

export function CommentDeleteButton({ postId, commentId }: CommentDeleteButtonProps) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("댓글을 삭제하시겠습니까?")) return;

    try {
      const res = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete comment");

      router.refresh();
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("댓글 삭제에 실패했습니다.");
    }
  };

  return (
    <Button variant="ghost" size="xs" onClick={handleDelete}>
      삭제
    </Button>
  );
}
