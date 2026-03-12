"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "community-post-draft";
const MAX_IMAGES = 5;

interface ImageData {
  url: string;
  blobPath: string;
  size: number;
}

export default function NewPostPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("CHAT");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [anonymousCooldownUntil, setAnonymousCooldownUntil] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<ImageData[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-save to localStorage (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (title || content || category !== "CHAT") {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ title, content, category, isAnonymous })
        );
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [title, content, category, isAnonymous]);

  // Check anonymous cooldown
  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/posts/anonymous-status")
        .then((res) => res.json())
        .then((data) => {
          setAnonymousCooldownUntil(data.cooldownUntil || null);
          if (data.cooldownUntil) setIsAnonymous(false);
        })
        .catch(() => {});
    }
  }, [status]);

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem(STORAGE_KEY);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (confirm("임시저장된 글이 있습니다. 불러올까요?")) {
          setTitle(parsed.title || "");
          setContent(parsed.content || "");
          setCategory(parsed.category || "CHAT");
          setIsAnonymous(parsed.isAnonymous || false);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const newHeight = Math.min(
        Math.max(textareaRef.current.scrollHeight, 200),
        500
      );
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [content]);

  const handleImageClick = () => {
    if (images.length >= MAX_IMAGES) {
      alert(`이미지는 최대 ${MAX_IMAGES}장까지 첨부할 수 있습니다.`);
      return;
    }
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = MAX_IMAGES - images.length;
    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    if (filesToUpload.length < files.length) {
      alert(`이미지는 최대 ${MAX_IMAGES}장까지 첨부할 수 있습니다.`);
    }

    setUploadingImages(true);

    try {
      const uploadPromises = filesToUpload.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/posts/upload-image", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "업로드 실패");
        }

        const data = await res.json();
        return {
          url: data.url,
          blobPath: data.url,
          size: file.size,
        };
      });

      const uploadedImages = await Promise.all(uploadPromises);
      setImages((prev) => [...prev, ...uploadedImages]);
    } catch (error) {
      console.error("Image upload error:", error);
      alert(error instanceof Error ? error.message : "이미지 업로드에 실패했습니다.");
    } finally {
      setUploadingImages(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

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

  // Role check: only JOBSEEKER and ADMIN can create posts
  if (session.user.role !== "JOBSEEKER" && session.user.role !== "ADMIN") {
    return (
      <div className="mx-auto max-w-screen-xl px-4 py-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="mb-4 text-lg font-semibold">구직자 회원만 글을 작성할 수 있습니다</p>
            <Link href="/community">
              <Button>목록으로</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          category,
          isAnonymous,
          imageUrls: images,
        }),
      });

      if (!res.ok) throw new Error("Failed to create post");

      const data = await res.json();

      // Clear draft on successful submission
      localStorage.removeItem(STORAGE_KEY);

      router.push(`/community/${data.slug || data.id}`);
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
          <div className="mb-4 rounded-md border border-yellow-600/30 bg-yellow-900/10 px-4 py-3">
            <p className="text-sm font-medium text-yellow-500/90">
              성매매 알선/권유, 음란물, 청소년 고용 유도는 법적 처벌 대상입니다.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              욕설/비방/개인정보 노출 시 게시물 삭제 및 이용 제한됩니다.{" "}
              <Link href="/terms" target="_blank" className="text-primary hover:underline">
                이용약관 제9조
              </Link>
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label htmlFor="category" className="block text-sm font-medium mb-2">
                  카테고리
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="CHAT">수다톡</option>
                  <option value="BEAUTY">뷰티톡</option>
                  <option value="QNA">질문톡</option>
                  <option value="WORK">가게톡</option>
                </select>
              </div>
              <div className="flex items-end">
                {(() => {
                  const isOnAnonCooldown = !!(anonymousCooldownUntil && new Date(anonymousCooldownUntil) > new Date());
                  return (
                    <label className={`flex items-center gap-2 ${isOnAnonCooldown ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
                      <input
                        type="checkbox"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        disabled={isOnAnonCooldown}
                        className="w-4 h-4 rounded border-border bg-background text-primary focus:ring-2 focus:ring-primary"
                      />
                      <span className="text-sm font-medium">익명으로 작성</span>
                    </label>
                  );
                })()}
              </div>
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
                    ref={textareaRef}
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    maxLength={2000}
                    required
                    style={{ minHeight: "200px", maxHeight: "500px" }}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none overflow-y-auto"
                    placeholder="내용을 입력하세요 (최대 2000자)"
                  />
              <div className="mt-1 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleImageClick}
                  disabled={uploadingImages || images.length >= MAX_IMAGES}
                  className="flex items-center gap-1 px-2 py-1 text-xs rounded border border-border hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={`이미지 첨부 (${images.length}/${MAX_IMAGES})`}
                >
                  📷 이미지 첨부 ({images.length}/{MAX_IMAGES})
                </button>
                <span className="text-xs text-muted-foreground">
                  {content.length}/2000
                </span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="hidden"
              />

              {images.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    첨부된 이미지 ({images.length}/{MAX_IMAGES})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={img.url}
                          alt={`첨부 이미지 ${idx + 1}`}
                          className="w-20 h-20 object-cover rounded border border-border"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {uploadingImages && (
                <p className="text-xs text-primary mt-2">이미지 업로드 중...</p>
              )}
            </div>

            {!!(anonymousCooldownUntil && new Date(anonymousCooldownUntil) > new Date()) && (
              <div className="rounded-md border border-red-500/20 bg-red-500/[0.08] px-3 py-2.5 text-xs text-red-400">
                {new Date(anonymousCooldownUntil).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}까지 익명 작성이 불가합니다.
                <br />
                <span className="text-muted-foreground">최근 익명 글을 작성하여 30일 쿨다운이 적용 중입니다.</span>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Link href="/community">
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  취소
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting || uploadingImages}>
                {isSubmitting ? "작성 중..." : "작성완료"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
