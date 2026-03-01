"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface CommentEditButtonProps {
  postId: string;
  commentId: string;
  initialContent: string;
}

export function CommentEditButton({ postId, commentId, initialContent }: CommentEditButtonProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(initialContent);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 300) + "px";
  }, []);

  useEffect(() => {
    if (isEditing) autoResize();
  }, [isEditing, autoResize]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setContent(initialContent);
    setIsEditing(false);
  };

  const handleSubmit = async () => {
    if (!content.trim() || content.length > 500) {
      alert("댓글은 1-500자로 입력해주세요");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/posts/${postId}/comments/${commentId}/edit`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) throw new Error("Failed to update comment");

      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error("Error updating comment:", error);
      alert("댓글 수정에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isEditing) {
    return (
      <Button variant="ghost" size="xs" onClick={handleEdit}>
        수정
      </Button>
    );
  }

  return (
    <div className="mt-2 w-full space-y-2">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => { setContent(e.target.value); autoResize(); }}
        maxLength={500}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        rows={3}
        style={{ minHeight: "4.5rem", maxHeight: "300px", overflow: "auto" }}
        disabled={isSubmitting}
      />
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {content.length}/500
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "수정 중..." : "수정완료"}
          </Button>
        </div>
      </div>
    </div>
  );
}
