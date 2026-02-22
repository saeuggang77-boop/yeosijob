-- AlterTable: Remove resume expiration fields
DROP INDEX IF EXISTS "resumes_expiresAt_idx";
ALTER TABLE "resumes" DROP COLUMN IF EXISTS "expiresAt";
ALTER TABLE "resumes" DROP COLUMN IF EXISTS "lastRefreshedAt";
