"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  images: string[];
}

export function AdDetailGallery({ images }: Props) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const close = useCallback(() => setViewerIndex(null), []);

  const prev = useCallback(() => {
    setViewerIndex((i) => (i !== null ? (i - 1 + images.length) % images.length : null));
  }, [images.length]);

  const next = useCallback(() => {
    setViewerIndex((i) => (i !== null ? (i + 1) % images.length : null));
  }, [images.length]);

  useEffect(() => {
    if (viewerIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [viewerIndex, close, prev, next]);

  if (images.length === 0) return null;

  return (
    <>
      <h4 className="mb-2 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
        상세 이미지 ({images.length})
      </h4>

      <div className={`grid gap-2 ${images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
        {images.map((url, i) => (
          <button
            key={url}
            type="button"
            onClick={() => setViewerIndex(i)}
            className="group relative overflow-hidden rounded-lg border border-border transition-all hover:border-primary/50"
          >
            <Image
              src={url}
              alt={`상세 이미지 ${i + 1}`}
              width={600}
              height={400}
              className="w-full object-cover transition-transform group-hover:scale-[1.02]"
              sizes="(max-width: 640px) 50vw, 300px"
            />
            <span className="absolute bottom-1.5 right-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white/70">
              {i + 1}/{images.length}
            </span>
          </button>
        ))}
      </div>

      {/* Fullscreen Viewer (portal to body) */}
      {viewerIndex !== null &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95"
            onClick={close}
          >
            {/* Close button */}
            <button
              onClick={close}
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Nav - Previous */}
            {images.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}

            {/* Image */}
            <Image
              src={images[viewerIndex]}
              alt={`상세 이미지 ${viewerIndex + 1}`}
              width={1200}
              height={1600}
              className="max-h-[90vh] max-w-[95vw] rounded-lg object-contain"
              sizes="95vw"
              onClick={(e) => e.stopPropagation()}
              priority
            />

            {/* Nav - Next */}
            {images.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}

            {/* Counter */}
            <div className="absolute bottom-6 text-sm text-white/50">
              {viewerIndex + 1} / {images.length}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
