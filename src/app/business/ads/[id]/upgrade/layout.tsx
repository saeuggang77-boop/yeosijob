import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * 스탭 계정 차단: 업그레이드 페이지 접근 불가
 * page.tsx가 client component이므로 layout.tsx에서 서버단 차단
 */
export default async function UpgradeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isStaff: true },
  });
  if (user?.isStaff) redirect("/business/dashboard");

  return <>{children}</>;
}
