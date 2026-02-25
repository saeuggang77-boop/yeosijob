"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

interface CommentFormProps {
  postId: string;
  parentId?: string;
  replyToName?: string;
  onCancel?: () => void;
}

export function CommentForm({ postId, parentId, replyToName, onCancel }: CommentFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize content with @mention for replies
  useEffect(() => {
    if (replyToName) {
      setContent(`@${replyToName} `);
    }
  }, [replyToName]);

  if (!session) {
    return (
      <div className="rounded-md border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        로그인 후 댓글을 작성할 수 있습니다
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, parentId }),
      });

      if (!res.ok) throw new Error("Failed to create comment");

      setContent("");
      router.refresh();
      onCancel?.();
    } catch (error) {
      console.error("Error creating comment:", error);
      alert("댓글 작성에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const rows = parentId ? 2 : 3;
  const placeholder = parentId ? "답글을 입력하세요" : "댓글을 입력하세요 (최대 500자)";

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={500}
        required
        rows={rows}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        placeholder={placeholder}
      />
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {content.length}/500
        </div>
        <div className="flex gap-2">
          {onCancel && (
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              취소
            </Button>
          )}
          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting ? "작성 중..." : parentId ? "답글 작성" : "댓글 작성"}
          </Button>
        </div>
      </div>
    </form>
  );
}
