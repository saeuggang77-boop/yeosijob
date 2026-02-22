-- Step 1: Add new columns to resumes (with defaults for existing rows)
ALTER TABLE "resumes"
ADD COLUMN "gender" TEXT NOT NULL DEFAULT '여성',
ADD COLUMN "height" INTEGER,
ADD COLUMN "weight" INTEGER,
ADD COLUMN "districts" TEXT[] DEFAULT '{}',
ADD COLUMN "experienceLevel" TEXT NOT NULL DEFAULT 'BEGINNER',
ADD COLUMN "desiredSalaryType" TEXT,
ADD COLUMN "desiredSalaryAmount" INTEGER,
ADD COLUMN "availableHours" TEXT,
ADD COLUMN "kakaoId" TEXT NOT NULL DEFAULT '',
ADD COLUMN "phone" TEXT,
ADD COLUMN "title" TEXT NOT NULL DEFAULT '',
ADD COLUMN "photoUrl" TEXT,
ADD COLUMN "expiresAt" TIMESTAMP(3),
ADD COLUMN "lastRefreshedAt" TIMESTAMP(3),
ADD COLUMN "lastBumpedAt" TIMESTAMP(3);

-- Step 2: Migrate existing data before dropping old columns
-- Copy district into districts array
UPDATE "resumes" SET "districts" = ARRAY["district"] WHERE "district" IS NOT NULL AND "district" != '';

-- Copy title from nickname for existing resumes
UPDATE "resumes" SET "title" = "nickname" WHERE "title" = '';

-- Set introduction default for any NULL values (before making NOT NULL)
UPDATE "resumes" SET "introduction" = '' WHERE "introduction" IS NULL;

-- Set expiresAt to now+30 days for public resumes
UPDATE "resumes" SET "expiresAt" = NOW() + INTERVAL '30 days' WHERE "isPublic" = true;

-- Set lastBumpedAt to updatedAt for existing resumes
UPDATE "resumes" SET "lastBumpedAt" = "updatedAt";

-- Set age to 0 for any NULL values (before making NOT NULL)
UPDATE "resumes" SET "age" = 0 WHERE "age" IS NULL;

-- Step 3: Make age and introduction NOT NULL, set introduction default
ALTER TABLE "resumes" ALTER COLUMN "age" SET NOT NULL;
ALTER TABLE "resumes" ALTER COLUMN "introduction" SET NOT NULL;
ALTER TABLE "resumes" ALTER COLUMN "introduction" SET DEFAULT '';

-- Step 4: Drop old columns
ALTER TABLE "resumes" DROP COLUMN "district";
ALTER TABLE "resumes" DROP COLUMN "experience";

-- Step 5: Add adId to resume_view_logs
ALTER TABLE "resume_view_logs" ADD COLUMN "adId" TEXT;

-- Step 6: Create new indexes
CREATE INDEX "resumes_isPublic_lastBumpedAt_idx" ON "resumes"("isPublic", "lastBumpedAt" DESC);
CREATE INDEX "resumes_expiresAt_idx" ON "resumes"("expiresAt");
