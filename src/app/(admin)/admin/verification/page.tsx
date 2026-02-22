import { prisma } from "@/lib/prisma";
import { VerificationActions } from "@/components/admin/VerificationActions";

export default async function VerificationPage() {
  const pendingUsers = await prisma.user.findMany({
    where: {
      businessNumber: { not: null },
      isVerifiedBiz: false,
      role: "BUSINESS",
    },
    select: {
      id: true,
      name: true,
      email: true,
      businessName: true,
      businessNumber: true,
      createdAt: true,
      _count: { select: { ads: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const verifiedUsers = await prisma.user.findMany({
    where: { isVerifiedBiz: true },
    select: {
      id: true, name: true, email: true, businessName: true, businessNumber: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6">
      <h1 className="text-2xl font-bold">업소 인증 관리</h1>

      <h2 className="mt-6 text-lg font-semibold">대기 중 ({pendingUsers.length}건)</h2>
      {pendingUsers.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">대기 중인 인증 요청이 없습니다</p>
      ) : (
        <div className="mt-3 space-y-3">
          {pendingUsers.map((user) => (
            <div key={user.id} className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">{user.businessName || user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <p className="mt-1 text-sm">사업자번호: <span className="font-mono">{user.businessNumber}</span></p>
                  <p className="text-xs text-muted-foreground">광고 {user._count.ads}건</p>
                </div>
                <VerificationActions userId={user.id} />
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="mt-8 text-lg font-semibold">인증 완료 ({verifiedUsers.length}건)</h2>
      <div className="mt-3 space-y-2">
        {verifiedUsers.map((user) => (
          <div key={user.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
            <span>{user.businessName || user.name} ({user.email})</span>
            <span className="font-mono text-xs text-muted-foreground">{user.businessNumber}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
