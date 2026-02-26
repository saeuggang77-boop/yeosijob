"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function NewPostPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("CHAT");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-screen-xl px-4 py-8">
        <div className="text-center">로딩 중...</div>
      </div>
    );
  }

  if (!session) {
    router.push("/login");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, category }),
      });

      if (!res.ok) throw new Error("Failed to create post");

      const data = await res.json();
      router.push(`/community/${data.id}`);
    } catch (error) {
      console.error("Error creating post:", error);
      alert("게시글 작성에 실패했습니다.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>글쓰기</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium mb-2">
                카테고리
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="CHAT">수다방</option>
                <option value="BEAUTY">뷰티톡</option>
                <option value="QNA">질문방</option>
                <option value="WORK">가게이야기</option>
              </select>
            </div>

            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-2">
                제목
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={50}
                required
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="제목을 입력하세요 (최대 50자)"
              />
              <div className="mt-1 text-right text-xs text-muted-foreground">
                {title.length}/50
              </div>
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium mb-2">
                내용
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={2000}
                required
                rows={12}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                placeholder="내용을 입력하세요 (최대 2000자)"
              />
              <div className="mt-1 text-right text-xs text-muted-foreground">
                {content.length}/2000
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Link href="/community">
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  취소
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "작성 중..." : "작성완료"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
