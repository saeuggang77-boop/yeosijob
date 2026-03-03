"use client";

import { useState } from "react";
import Link from "next/link";
import { timeAgo } from "@/lib/utils/format";

type PostCategory = "CHAT" | "BEAUTY" | "QNA" | "WORK";

type Post = {
  id: string;
  slug: string | null;
  title: string;
  content?: string;
  category: string;
  createdAt: Date | string;
  _count: {
    comments: number;
    likes?: number;
  };
};

type Props = {
  hotPost: Post | null;
  postsByCategory: Record<string, Post[]>;
};

const CATEGORY_TABS = [
  { id: "ALL" as const, label: "전체" },
  { id: "CHAT" as const, label: "수다톡" },
  { id: "BEAUTY" as const, label: "뷰티톡" },
  { id: "QNA" as const, label: "질문톡" },
  { id: "WORK" as const, label: "가게톡" },
];

function getCategoryBadgeClass(category: string): string {
  switch (category) {
    case "BEAUTY":
      return "bg-pink-500/15 text-pink-400";
    case "QNA":
      return "bg-blue-500/15 text-blue-400";
    case "WORK":
      return "bg-green-500/15 text-green-400";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function getCategoryLabel(category: string): string {
  switch (category) {
    case "CHAT":
      return "수다톡";
    case "BEAUTY":
      return "뷰티톡";
    case "QNA":
      return "질문톡";
    case "WORK":
      return "가게톡";
    default:
      return category;
  }
}

function isNewPost(createdAt: Date | string): boolean {
  return Date.now() - new Date(createdAt).getTime() < 24 * 60 * 60 * 1000;
}

function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

export function CommunitySection({ hotPost, postsByCategory }: Props) {
  const [activeCategory, setActiveCategory] = useState<string>("ALL");

  // Get posts for active category directly (already fetched per-category from server)
  const categoryPosts = postsByCategory[activeCategory] || [];

  // Check if hot post should be shown
  const showHotPost = hotPost && (activeCategory === "ALL" || hotPost.category === activeCategory);

  // Take only 4 posts for the list (after hot post)
  const displayPosts = categoryPosts.slice(0, 4);

  return (
    <div>
      {/* Category Tabs */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveCategory(tab.id)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              activeCategory === tab.id
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Hot Post Card */}
      {showHotPost && (
        <div className="mb-4 rounded-lg border border-primary/30 bg-gradient-to-r from-primary/10 to-primary/5 p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
              HOT 🔥
            </span>
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${getCategoryBadgeClass(hotPost.category)}`}>
              {getCategoryLabel(hotPost.category)}
            </span>
          </div>
          <Link href={`/community/${hotPost.slug || hotPost.id}`}>
            <h3 className="mb-2 text-lg font-bold hover:text-primary">{hotPost.title}</h3>
          </Link>
          {hotPost.content && (
            <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
              {stripHtmlTags(hotPost.content).slice(0, 80)}
              {stripHtmlTags(hotPost.content).length > 80 ? "..." : ""}
            </p>
          )}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>💬 댓글 {hotPost._count.comments}</span>
            <span>👍 추천 {hotPost._count.likes ?? 0}</span>
            <span>{timeAgo(hotPost.createdAt)}</span>
          </div>
        </div>
      )}

      {/* Post List */}
      <div className="divide-y divide-border rounded-lg border">
        {displayPosts.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            게시글이 없습니다
          </div>
        ) : (
          displayPosts.map((post) => (
            <Link
              key={post.id}
              href={`/community/${post.slug || post.id}`}
              className="block transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${getCategoryBadgeClass(post.category)}`}>
                    {getCategoryLabel(post.category)}
                  </span>
                  <span className="truncate text-sm font-medium">{post.title}</span>
                  {post._count.comments > 0 && (
                    <span className="shrink-0 text-xs text-primary">[{post._count.comments}]</span>
                  )}
                  {isNewPost(post.createdAt) && (
                    <span className="ml-1 shrink-0 rounded-sm bg-red-500/15 px-1 py-0.5 text-[10px] font-bold leading-none text-red-400">
                      N
                    </span>
                  )}
                </div>
                <div className="shrink-0 text-xs text-muted-foreground">
                  {timeAgo(post.createdAt)}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
