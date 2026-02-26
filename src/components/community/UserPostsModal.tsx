"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDateSmart } from "@/lib/utils/format";

interface Post {
  id: string;
  title: string;
  category: string;
  createdAt: string;
  viewCount: number;
  _count: {
    comments: number;
  };
}

interface UserPostsModalProps {
  userId: string;
  userName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function UserPostsModal({
  userId,
  userName,
  isOpen,
  onClose,
}: UserPostsModalProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      fetchPosts(1);
    } else {
      document.body.style.overflow = "";
      setPosts([]);
      setPage(1);
    }

    return () => {
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, userId]);

  const fetchPosts = async (pageNum: number) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/users/${userId}/posts?page=${pageNum}&limit=10`
      );
      const data = await res.json();

      if (res.ok) {
        setPosts(data.posts);
        setTotalPages(data.totalPages);
        setPage(pageNum);
      } else {
        console.error("Failed to fetch posts:", data.error);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostClick = (postId: string) => {
    router.push(`/community/${postId}`);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getCategoryBadgeStyle = (category: string) => {
    switch (category) {
      case "BEAUTY":
        return "bg-pink-500/15 text-pink-600 dark:text-pink-400";
      case "QNA":
        return "bg-blue-500/15 text-blue-600 dark:text-blue-400";
      case "WORK":
        return "bg-green-500/15 text-green-600 dark:text-green-400";
      case "CHAT":
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "CHAT":
        return "수다방";
      case "BEAUTY":
        return "뷰티톡";
      case "QNA":
        return "질문방";
      case "WORK":
        return "가게이야기";
      default:
        return category;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={handleOverlayClick}
    >
      <div
        className="relative flex max-h-[80vh] w-full max-w-[600px] flex-col rounded-xl border border-border bg-card shadow-2xl md:w-[600px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold">
            {userName}님의 게시글
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : posts.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground">
              작성한 게시글이 없습니다
            </div>
          ) : (
            <div className="space-y-2">
              {posts.map((post) => (
                <button
                  key={post.id}
                  onClick={() => handlePostClick(post.id)}
                  className="w-full rounded-lg border border-border p-4 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${getCategoryBadgeStyle(
                        post.category
                      )}`}
                    >
                      {getCategoryLabel(post.category)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">
                          {post.title}
                        </span>
                        {post._count.comments > 0 && (
                          <span className="shrink-0 text-xs text-primary">
                            [{post._count.comments}]
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatDateSmart(post.createdAt)}</span>
                        <span>·</span>
                        <span>조회 {post.viewCount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && !loading && (
          <div className="border-t border-border px-6 py-4">
            <div className="flex items-center justify-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => fetchPosts(p)}
                  disabled={p === page}
                  className={`flex h-8 w-8 items-center justify-center rounded text-sm transition-colors ${
                    p === page
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
