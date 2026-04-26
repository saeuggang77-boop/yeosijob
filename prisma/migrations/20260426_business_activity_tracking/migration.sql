-- AlterTable: 사장님 활동 추적 + 무료광고 만료 알림 발송 기록 (idempotent)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastBusinessActivityAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastFreeExpiryNotifiedAt" TIMESTAMP(3);

-- 기존 BUSINESS 회원은 마이그레이션 시점부터 90일 유예 부여
-- (NULL이면 즉시 만료 위험 → NOW()로 세팅하여 D-Day 리셋)
UPDATE "users"
SET "lastBusinessActivityAt" = NOW()
WHERE "role" = 'BUSINESS' AND "lastBusinessActivityAt" IS NULL;
