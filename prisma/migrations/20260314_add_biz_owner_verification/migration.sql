-- AlterTable: User에 대표자명 추가
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "bizOwnerName" TEXT;

-- AlterTable: Partner에 사업자 인증 필드 추가
ALTER TABLE "partners" ADD COLUMN IF NOT EXISTS "businessNumber" TEXT;
ALTER TABLE "partners" ADD COLUMN IF NOT EXISTS "bizOwnerName" TEXT;
ALTER TABLE "partners" ADD COLUMN IF NOT EXISTS "isVerifiedBiz" BOOLEAN NOT NULL DEFAULT false;
