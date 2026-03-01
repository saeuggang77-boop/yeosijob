-- AlterTable: Post에 익명 글쓰기 필드 추가
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "isAnonymous" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: PostLike에 반응 타입 필드 추가
ALTER TABLE "post_likes" ADD COLUMN IF NOT EXISTS "reactionType" TEXT NOT NULL DEFAULT 'LIKE';

-- CreateTable: 게시글 이미지
CREATE TABLE IF NOT EXISTS "post_images" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "blobPath" TEXT NOT NULL,
    "size" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "post_images_postId_idx" ON "post_images"("postId");

-- AddForeignKey
ALTER TABLE "post_images" ADD CONSTRAINT "post_images_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
