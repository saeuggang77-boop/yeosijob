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
      className="flex items-center gap-1.5 text-sm transition-colors hover:text-primary"
    >
      <span className={`text-base ${liked ? "" : "grayscale opacity-60"}`}>👍</span>
      <span className={liked ? "text-primary" : "text-muted-foreground"}>
        추천{count > 0 ? ` ${count}` : ""}
      </span>
    </button>
  );
}
