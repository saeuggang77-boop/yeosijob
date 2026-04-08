-- AlterTable
ALTER TABLE "ads" ADD COLUMN     "autoRenewCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastAutoRenewedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isStaff" BOOLEAN NOT NULL DEFAULT false;
