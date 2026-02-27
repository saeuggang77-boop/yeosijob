"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { use } from "react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditPostPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session, status } = useSession();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
      return;
    }

    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/posts/${id}`);
        if (!res.ok) throw new Error("Failed to fetch post");

        const data = await res.json();

        // Check if user is the author or admin
        const isAdmin = session.user.role === "ADMIN";
        if (data.authorId !== session.user.id && !isAdmin) {
          alert("수정 권한이 없습니다.");
          router.push(`/community/${id}`);
          return;
        }

        setTitle(data.title);
        setContent(data.content);
      } catch (error) {
        console.error("Error fetching post:", error);
        alert("게시글을 불러오는데 실패했습니다.");
        router.push("/community");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [id, session, status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });

      if (!res.ok) throw new Error("Failed to update post");

      router.push(`/community/${id}`);
    } catch (error) {
      console.error("Error updating post:", error);
      alert("게시글 수정에 실패했습니다.");
      setIsSubmitting(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="mx-auto max-w-screen-xl px-4 py-8">
        <div className="text-center">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>글 수정</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <Link href={`/community/${id}`}>
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  취소
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "수정 중..." : "수정완료"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
