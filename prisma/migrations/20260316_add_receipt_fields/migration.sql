-- AlterTable: Payment에 증빙서류 관련 필드 추가
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "receiptType" TEXT;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "taxEmail" TEXT;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "cashReceiptNo" TEXT;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "cashReceiptType" TEXT;
