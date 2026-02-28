-- AlterTable: Replace height/weight with bodyType
ALTER TABLE "resumes" ADD COLUMN "bodyType" TEXT;
ALTER TABLE "resumes" DROP COLUMN IF EXISTS "height";
ALTER TABLE "resumes" DROP COLUMN IF EXISTS "weight";
