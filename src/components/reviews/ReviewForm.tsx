"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ReviewFormProps {
  adId: string;
  onSuccess?: () => void;
}

export function ReviewForm({ adId, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (rating === 0) {
      setError("별점을 선택해주세요");
      return;
    }

    if (content.length < 10) {
      setError("후기는 최소 10자 이상 입력해주세요");
      return;
    }

    if (content.length > 500) {
      setError("후기는 최대 500자까지 입력 가능합니다");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adId, rating, content }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "후기 작성에 실패했습니다");
      }

      setRating(0);
      setContent("");
      onSuccess?.();
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayRating = hoveredRating || rating;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">후기 작성</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Star Rating */}
          <div>
            <label className="mb-2 block text-sm font-medium">별점</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="text-3xl transition-colors hover:scale-110"
                  aria-label={`${star}점`}
                >
                  {star <= displayRating ? (
                    <span className="text-yellow-400">★</span>
                  ) : (
                    <span className="text-gray-300">☆</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div>
            <label htmlFor="review-content" className="mb-2 block text-sm font-medium">
              후기 내용
            </label>
            <Textarea
              id="review-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="업소에서 근무한 경험을 공유해주세요 (10자 이상)"
              className="min-h-[100px]"
              maxLength={500}
            />
            <div className="mt-1 text-xs text-muted-foreground">
              {content.length}/500
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "등록 중..." : "후기 등록"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
