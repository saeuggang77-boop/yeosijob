"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { X, Plus, ImageIcon, Loader2 } from "lucide-react";

interface Props {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export function AdImageUploader({ images, onChange, maxImages = 10 }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    const remaining = maxImages - images.length;
    if (remaining <= 0) {
      setError(`최대 ${maxImages}장까지 업로드 가능합니다`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remaining);
    setError("");
    setUploading(true);

    try {
      const uploaded: string[] = [];

      for (const file of filesToUpload) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/ads/upload-image", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "업로드 실패");
          break;
        }
        uploaded.push(data.url);
      }

      if (uploaded.length > 0) {
        onChange([...images, ...uploaded]);
      }
    } catch {
      setError("업로드 중 오류가 발생했습니다");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function handleRemove(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div className="space-y-3">
      {/* Uploaded Images Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((url, i) => (
            <div key={url} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
              <Image
                src={url}
                alt={`상세 이미지 ${i + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 33vw, 200px"
              />
              <button
                type="button"
                onClick={() => handleRemove(i)}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/90"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
                {i + 1}
              </span>
            </div>
          ))}

          {/* Add more button (inline) */}
          {images.length < maxImages && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex aspect-square items-center justify-center rounded-lg border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              {uploading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <Plus className="h-6 w-6" />
              )}
            </button>
          )}
        </div>
      )}

      {/* Empty state - Drop zone */}
      {images.length === 0 && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => !uploading && fileInputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border px-4 py-8 transition-colors hover:border-primary hover:bg-primary/5"
        >
          {uploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : (
            <>
              <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                <span className="font-medium text-primary">클릭</span> 또는{" "}
                <span className="font-medium text-primary">드래그</span>하여 업로드
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                JPG, PNG, WEBP · 장당 5MB · 최대 {maxImages}장
              </p>
            </>
          )}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Count + Error */}
      <div className="flex items-center justify-between">
        {error && <p className="text-xs text-destructive">{error}</p>}
        {images.length > 0 && (
          <p className="ml-auto text-xs text-muted-foreground">
            {images.length} / {maxImages}장
          </p>
        )}
      </div>
    </div>
  );
}
