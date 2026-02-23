"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditNoticePage({ params }: PageProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [noticeId, setNoticeId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    params.then((p) => {
      setNoticeId(p.id);
      fetchNotice(p.id);
    });
  }, []);

  if (!session || session.user.role !== "ADMIN") {
    router.push("/login");
    return null;
  }

  const fetchNotice = async (id: string) => {
    try {
      const res = await fetch(`/api/notices/${id}`);
      if (!res.ok) throw new Error("공지사항을 불러올 수 없습니다");

      const data = await res.json();
      setTitle(data.title);
      setContent(data.content);
      setIsPinned(data.isPinned);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (title.length < 1 || title.length > 100) {
      setError("제목은 1-100자로 입력해주세요");
      return;
    }

    if (content.length < 1 || content.length > 5000) {
      setError("내용은 1-5000자로 입력해주세요");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/notices/${noticeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, isPinned }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "공지사항 수정에 실패했습니다");
      }

      router.push("/admin/notices");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        로딩 중...
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">공지사항 수정</h1>

      <Card className="p-6">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label htmlFor="title" className="mb-2 block text-sm font-medium">
                제목 <span className="text-destructive">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="공지사항 제목을 입력하세요"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                maxLength={100}
                required
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {title.length}/100
              </p>
            </div>

            {/* Content */}
            <div>
              <label htmlFor="content" className="mb-2 block text-sm font-medium">
                내용 <span className="text-destructive">*</span>
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="공지사항 내용을 입력하세요"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                rows={15}
                maxLength={5000}
                required
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {content.length}/5000
              </p>
            </div>

            {/* isPinned */}
            <div className="flex items-center gap-2">
              <input
                id="isPinned"
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="isPinned" className="text-sm font-medium">
                상단 고정
              </label>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "수정 중..." : "수정"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/notices")}
              >
                취소
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}
