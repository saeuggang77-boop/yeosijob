-- CreateEnum
CREATE TYPE "GhostPersonality" AS ENUM ('CHATTY', 'ADVISOR', 'QUESTIONER', 'EMOJI_LOVER', 'CALM', 'SASSY');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('POST', 'COMMENT', 'REPLY');

-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'FREE_CREDIT';

-- AlterTable
ALTER TABLE "comments" ADD COLUMN     "parentId" TEXT;

-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'FREE_TALK';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "ageVerified" TIMESTAMP(3),
ADD COLUMN     "freeAdCredits" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "ghostPersonality" "GhostPersonality",
ADD COLUMN     "isGhost" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "age_verifications" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "birthDate" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "carrier" TEXT,
    "impUid" TEXT NOT NULL,
    "userId" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "age_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_pool" (
    "id" TEXT NOT NULL,
    "type" "ContentType" NOT NULL,
    "personality" "GhostPersonality" NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "category" TEXT,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_pool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auto_content_config" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "postsPerDay" INTEGER NOT NULL DEFAULT 8,
    "commentsPerDay" INTEGER NOT NULL DEFAULT 30,
    "repliesPerDay" INTEGER NOT NULL DEFAULT 15,
    "activeStartHour" INTEGER NOT NULL DEFAULT 14,
    "activeEndHour" INTEGER NOT NULL DEFAULT 4,
    "realPostAutoReply" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auto_content_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_email_token_key" ON "password_reset_tokens"("email", "token");

-- CreateIndex
CREATE UNIQUE INDEX "age_verifications_token_key" ON "age_verifications"("token");

-- CreateIndex
CREATE UNIQUE INDEX "age_verifications_impUid_key" ON "age_verifications"("impUid");

-- CreateIndex
CREATE INDEX "age_verifications_token_idx" ON "age_verifications"("token");

-- CreateIndex
CREATE INDEX "age_verifications_expiresAt_idx" ON "age_verifications"("expiresAt");

-- CreateIndex
CREATE INDEX "content_pool_type_personality_isUsed_idx" ON "content_pool"("type", "personality", "isUsed");

-- CreateIndex
CREATE INDEX "content_pool_type_isUsed_idx" ON "content_pool"("type", "isUsed");

-- CreateIndex
CREATE INDEX "comments_parentId_idx" ON "comments"("parentId");

-- CreateIndex
CREATE INDEX "posts_category_createdAt_idx" ON "posts"("category", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "users_isGhost_idx" ON "users"("isGhost");

-- AddForeignKey
ALTER TABLE "age_verifications" ADD CONSTRAINT "age_verifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
