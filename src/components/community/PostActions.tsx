"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PostActionsProps {
  postId: string;
  isAdmin: boolean;
}

export function PostActions({ postId, isAdmin }: PostActionsProps) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete post");
      }

      router.push("/community");
    } catch (error) {
      console.error("Error deleting post:", error);
      alert(error instanceof Error ? error.message : "게시글 삭제에 실패했습니다.");
    }
  };

  return (
    <div className="flex gap-2">
      <Link href={`/community/${postId}/edit`}>
        <Button variant="outline" size="sm">
          수정
        </Button>
      </Link>
      {isAdmin && (
        <Button variant="destructive" size="sm" onClick={handleDelete}>
          삭제
        </Button>
      )}
    </div>
  );
}
