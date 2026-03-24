-- AlterTable: Partner.grade를 nullable로 변경 (등급제 폐지, 카테고리별 가격으로 전환)
ALTER TABLE "Partner" ALTER COLUMN "grade" DROP NOT NULL;
