-- AlterTable: AgeVerification - PortOne → KCP 전환
ALTER TABLE "age_verifications" DROP COLUMN IF EXISTS "carrier";
ALTER TABLE "age_verifications" RENAME COLUMN "impUid" TO "certNo";
ALTER TABLE "age_verifications" ADD COLUMN IF NOT EXISTS "ci" TEXT;
ALTER TABLE "age_verifications" ADD COLUMN IF NOT EXISTS "di" TEXT;
ALTER TABLE "age_verifications" ADD COLUMN IF NOT EXISTS "sexCode" TEXT;

-- RenameIndex
ALTER INDEX IF EXISTS "age_verifications_impUid_key" RENAME TO "age_verifications_certNo_key";
