"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PostActionsProps {
  postId: string;
}

export function PostActions({ postId }: PostActionsProps) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete post");

      router.push("/community");
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("게시글 삭제에 실패했습니다.");
    }
  };

  return (
    <div className="flex gap-2">
      <Link href={`/community/${postId}/edit`}>
        <Button variant="outline" size="sm">
          수정
        </Button>
      </Link>
      <Button variant="destructive" size="sm" onClick={handleDelete}>
        삭제
      </Button>
    </div>
  );
}
