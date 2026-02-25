-- Rename existing post categories
UPDATE "posts" SET category = 'CHAT' WHERE category = 'FREE_TALK';
UPDATE "posts" SET category = 'QNA' WHERE category = 'QUESTION';
UPDATE "posts" SET category = 'BEAUTY' WHERE category = 'REVIEW';
UPDATE "posts" SET category = 'WORK' WHERE category = 'INFO';

-- Rename existing content_pool categories
UPDATE "content_pool" SET category = 'CHAT' WHERE category = 'FREE_TALK';
UPDATE "content_pool" SET category = 'QNA' WHERE category = 'QUESTION';
UPDATE "content_pool" SET category = 'BEAUTY' WHERE category = 'REVIEW';
UPDATE "content_pool" SET category = 'WORK' WHERE category = 'INFO';

-- AlterTable
ALTER TABLE "posts" ALTER COLUMN "category" SET DEFAULT 'CHAT';
