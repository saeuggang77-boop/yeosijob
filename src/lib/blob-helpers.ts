import { del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";

// Vercel Blob 무료 플랜 한도
export const BLOB_QUOTA_BYTES = 500 * 1024 * 1024; // 500MB

/**
 * 게시글의 모든 이미지를 Blob Store와 DB에서 삭제
 */
export async function deletePostImages(postId: string): Promise<void> {
  try {
    const images = await prisma.postImage.findMany({
      where: { postId },
      select: { url: true, id: true },
    });

    if (images.length === 0) return;

    const urls = images.map((img) => img.url);
    try {
      await del(urls);
    } catch (error) {
      console.error("Blob deletion error:", error);
    }

    await prisma.postImage.deleteMany({
      where: { postId },
    });
  } catch (error) {
    console.error("Delete post images error:", error);
    throw error;
  }
}

/**
 * 전체 PostImage 용량 조회 (bytes)
 */
export async function getTotalBlobUsage(): Promise<number> {
  try {
    const result = await prisma.postImage.aggregate({
      _sum: {
        size: true,
      },
    });

    return result._sum.size || 0;
  } catch (error) {
    console.error("Get total blob usage error:", error);
    return 0;
  }
}

/**
 * Blob 사용량을 퍼센트로 반환
 */
export async function getBlobUsagePercent(): Promise<number> {
  const usageBytes = await getTotalBlobUsage();
  return Math.round((usageBytes / BLOB_QUOTA_BYTES) * 100);
}

/**
 * 특정 이미지 URL을 Blob Store와 DB에서 삭제
 */
export async function deleteImageByUrl(url: string): Promise<void> {
  try {
    await del(url);

    await prisma.postImage.deleteMany({
      where: { url },
    });
  } catch (error) {
    console.error("Delete image by URL error:", error);
    throw error;
  }
}

/**
 * 오래된 이미지 정리 (고아 이미지 등)
 * - 삭제된 게시글의 이미지 정리
 */
export async function cleanupOrphanedImages(): Promise<number> {
  try {
    // PostImage has onDelete: Cascade, so orphaned images are automatically deleted
    // This function is kept for compatibility but returns 0
    // If needed, could query for images of deleted posts: post: { deletedAt: { not: null } }
    const orphanedImages = await prisma.postImage.findMany({
      where: {
        post: { deletedAt: { not: null } },
      },
      select: { url: true, id: true },
    });

    if (orphanedImages.length === 0) return 0;

    const urls = orphanedImages.map((img) => img.url);
    try {
      await del(urls);
    } catch (error) {
      console.error("Blob cleanup error:", error);
    }

    await prisma.postImage.deleteMany({
      where: {
        id: { in: orphanedImages.map((img) => img.id) },
      },
    });

    return orphanedImages.length;
  } catch (error) {
    console.error("Cleanup orphaned images error:", error);
    return 0;
  }
}
