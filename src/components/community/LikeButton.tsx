"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface LikeButtonProps {
  type: "post" | "comment";
  targetId: string;
  postId: string; // 댓글 좋아요 API 경로용
  initialLiked: boolean;
  initialCount: number;
  isLoggedIn: boolean;
}

export function LikeButton({
  type,
  targetId,
  postId,
  initialLiked,
  initialCount,
  isLoggedIn,
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleClick = async () => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    if (loading) return;

    // 낙관적 업데이트
    setLiked(!liked);
    setCount(liked ? count - 1 : count + 1);
    setLoading(true);

    try {
      const url =
        type === "post"
          ? `/api/posts/${postId}/like`
          : `/api/posts/${postId}/comments/${targetId}/like`;

      const res = await fetch(url, { method: "POST" });

      if (res.ok) {
        const data = await res.json();
        setLiked(data.liked);
        setCount(data.likeCount);
      } else {
        // 롤백
        setLiked(liked);
        setCount(count);
      }
    } catch {
      // 롤백
      setLiked(liked);
      setCount(count);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex items-center gap-1.5 text-sm transition-colors hover:text-red-500"
    >
      {liked ? (
        <svg className="h-5 w-5 fill-red-500 text-red-500" viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      ) : (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      )}
      <span className={liked ? "text-red-500" : "text-muted-foreground"}>
        좋아요{count > 0 ? ` ${count}` : ""}
      </span>
    </button>
  );
}
