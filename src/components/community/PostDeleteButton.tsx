"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface PostDeleteButtonProps {
  postId: string;
}

export function PostDeleteButton({ postId }: PostDeleteButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("이 게시글을 삭제하시겠습니까?")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      } else {
        alert("삭제에 실패했습니다");
      }
    } catch {
      alert("삭제 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-xs text-red-500 hover:text-red-400 disabled:opacity-50"
    >
      {loading ? "..." : "삭제"}
    </button>
  );
}
