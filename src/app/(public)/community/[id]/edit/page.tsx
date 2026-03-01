"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const MAX_IMAGES = 5;

interface ExistingImage {
  id: string;
  url: string;
}

interface NewImage {
  url: string;
  blobPath: string;
  size: number;
}

interface PostData {
  id: string;
  title: string;
  content: string;
  category: string;
  isAnonymous: boolean;
  isHidden: boolean;
  authorId: string;
  images: ExistingImage[];
  cooldownUntil?: string | null;
}

export default function EditPostPage() {
  const router = useRouter();
  const { id: postId } = useParams<{ id: string }>();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<PostData | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("CHAT");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [newImages, setNewImages] = useState<NewImage[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch post data
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/posts/${postId}`);
        if (!res.ok) {
          throw new Error("Failed to fetch post");
        }
        const data = await res.json();
        setPost(data);
        setTitle(data.title);
        setContent(data.content);
        setCategory(data.category || "CHAT");
        setIsAnonymous(data.isAnonymous || false);
        setIsHidden(data.isHidden || false);
        setExistingImages(data.images || []);
        setCooldownUntil(data.cooldownUntil || null);
      } catch (error) {
        console.error("Error fetching post:", error);
        alert("게시글을 불러올 수 없습니다.");
        router.push("/community");
      } finally {
        setLoading(false);
      }
    };

    if (status !== "loading") {
      fetchPost();
    }
  }, [postId, status, router]);

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
    const totalImages = existingImages.length + newImages.length;
    if (totalImages >= MAX_IMAGES) {
      alert(`이미지는 최대 ${MAX_IMAGES}장까지 첨부할 수 있습니다.`);
      return;
    }
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const totalImages = existingImages.length + newImages.length;
    const remainingSlots = MAX_IMAGES - totalImages;
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
          blobPath: data.blobPath,
          size: data.size,
        };
      });

      const uploadedImages = await Promise.all(uploadPromises);
      setNewImages((prev) => [...prev, ...uploadedImages]);
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

  const handleRemoveExistingImage = (id: string) => {
    setExistingImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleRemoveNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  };

  if (status === "loading" || loading) {
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

  if (!post) {
    return (
      <div className="mx-auto max-w-screen-xl px-4 py-8">
        <div className="text-center">게시글을 찾을 수 없습니다.</div>
      </div>
    );
  }

  // Permission check: only author or admin can edit
  const isAdmin = session.user.role === "ADMIN";
  const isAuthor = session.user.id === post.authorId;

  if (!isAuthor && !isAdmin) {
    return (
      <div className="mx-auto max-w-screen-xl px-4 py-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="mb-4 text-lg font-semibold">수정 권한이 없습니다</p>
            <Link href={`/community/${postId}`}>
              <Button>돌아가기</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Confirm if hiding for the first time
    if (isHidden && !post?.isHidden) {
      if (!confirm("비공개로 전환하면 30일간 다른 글을 비공개로 전환할 수 없습니다. 전환하시겠습니까?")) {
        setIsSubmitting(false);
        return;
      }
    }

    try {
      // Calculate deleted image IDs
      const originalImageIds = post.images.map((img) => img.id);
      const currentImageIds = existingImages.map((img) => img.id);
      const deleteImageIds = originalImageIds.filter(
        (id) => !currentImageIds.includes(id)
      );

      const res = await fetch(`/api/posts/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          category,
          isAnonymous,
          isHidden,
          deleteImageIds,
          newImages,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update post");
      }

      const data = await res.json();
      router.push(`/community/${data.slug || data.id}`);
    } catch (error) {
      console.error("Error updating post:", error);
      alert(error instanceof Error ? error.message : "게시글 수정에 실패했습니다.");
      setIsSubmitting(false);
    }
  };

  const totalImages = existingImages.length + newImages.length;
  const isOnCooldown = !!(cooldownUntil && new Date(cooldownUntil) > new Date());
  const isCurrentlyHidden = post?.isHidden || false;

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>게시글 수정</CardTitle>
        </CardHeader>
        <CardContent>
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
                  <option value="CHAT">수다방</option>
                  <option value="BEAUTY">뷰티톡</option>
                  <option value="QNA">질문방</option>
                  <option value="WORK">가게이야기</option>
                </select>
              </div>
              <div className="flex items-end">
                <label className={`flex items-center gap-2 ${isOnCooldown && !isCurrentlyHidden ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
                  <input
                    type="checkbox"
                    checked={isHidden}
                    onChange={(e) => setIsHidden(e.target.checked)}
                    disabled={isOnCooldown && !isCurrentlyHidden}
                    className="w-4 h-4 rounded border-border bg-background text-primary focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-sm font-medium">{isCurrentlyHidden ? '🔓 공개 전환' : '🔒 비공개 전환'}</span>
                </label>
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
                  disabled={uploadingImages || totalImages >= MAX_IMAGES}
                  className="flex items-center gap-1 px-2 py-1 text-xs rounded border border-border hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={`이미지 첨부 (${totalImages}/${MAX_IMAGES})`}
                >
                  📷 이미지 첨부 ({totalImages}/{MAX_IMAGES})
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

              {totalImages > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    첨부된 이미지 ({totalImages}/{MAX_IMAGES})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {existingImages.map((img) => (
                      <div key={img.id} className="relative group">
                        <img
                          src={img.url}
                          alt="기존 이미지"
                          className="w-20 h-20 object-cover rounded border border-border"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveExistingImage(img.id)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {newImages.map((img, idx) => (
                      <div key={`new-${idx}`} className="relative group">
                        <img
                          src={img.url}
                          alt={`새 이미지 ${idx + 1}`}
                          className="w-20 h-20 object-cover rounded border border-border"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveNewImage(idx)}
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

            {isOnCooldown && !isCurrentlyHidden && cooldownUntil && (
              <div className="rounded-md border border-red-500/20 bg-red-500/[0.08] px-3 py-2.5 text-xs text-red-400">
                🚫 {new Date(cooldownUntil).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}까지 비공개 전환이 불가합니다.
                <br />
                <span className="text-muted-foreground">다른 글을 최근 비공개로 전환하여 30일 쿨다운이 적용 중입니다.</span>
              </div>
            )}

            {isHidden && !isCurrentlyHidden && !isOnCooldown && (
              <div className="rounded-md border border-[#D4A853]/20 bg-[#D4A853]/[0.08] px-3 py-2.5 text-xs text-[#D4A853]">
                비공개로 전환하면 <strong>30일간 다른 글을 비공개로 전환할 수 없습니다.</strong>
                <br />
                목록에 제목만 표시되며, 내용은 작성자와 관리자만 볼 수 있습니다.
              </div>
            )}

            {isCurrentlyHidden && isHidden && (
              <div className="rounded-md border border-[#D4A853]/20 bg-[#D4A853]/[0.08] px-3 py-2.5 text-xs text-[#D4A853]">
                이 글은 현재 비공개 상태입니다. 체크 해제 시 공개로 전환됩니다.
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Link href={`/community/${postId}`}>
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  취소
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting || uploadingImages}>
                {isSubmitting ? "수정 중..." : "수정완료"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
