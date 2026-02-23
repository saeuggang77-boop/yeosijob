-- AlterEnum
ALTER TYPE "AdProductId" ADD VALUE 'FREE';

-- AlterTable
ALTER TABLE "resumes" ALTER COLUMN "districts" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "ads_status_productId_lastJumpedAt_idx" ON "ads"("status", "productId", "lastJumpedAt" DESC);

-- CreateIndex
CREATE INDEX "ads_status_regions_idx" ON "ads"("status", "regions");

-- CreateIndex
CREATE INDEX "resumes_isPublic_region_idx" ON "resumes"("isPublic", "region");
