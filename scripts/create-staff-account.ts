import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * 스탭 계정 생성 스크립트
 *
 * 사용법:
 *   STAFF_INITIAL_PASSWORD='...' npx tsx scripts/create-staff-account.ts
 *
 * 동작:
 *   - staff@yeosijob.com 계정이 없으면 생성 (isStaff=true, isVerifiedBiz=true)
 *   - 이미 존재하면 isStaff=true로 업그레이드
 */
async function main() {
  const email = "staff@yeosijob.com";
  const password = process.env.STAFF_INITIAL_PASSWORD;
  if (!password) {
    throw new Error("STAFF_INITIAL_PASSWORD env required");
  }

  const hash = await bcrypt.hash(password, 10);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({
      where: { email },
      data: { isStaff: true, isVerifiedBiz: true },
    });
    console.log("Existing account upgraded to staff:", email);
    return;
  }

  const user = await prisma.user.create({
    data: {
      email,
      hashedPassword: hash,
      name: "여시잡 스탭",
      businessName: "여시잡",
      role: "BUSINESS",
      isStaff: true,
      isVerifiedBiz: true,
    },
  });
  console.log("Staff account created:", user.email);
}

main()
  .catch((error) => {
    console.error("Staff account script failed:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
