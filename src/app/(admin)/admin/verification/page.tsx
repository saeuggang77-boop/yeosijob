import { prisma } from "@/lib/prisma";
import { VerificationActions } from "@/components/admin/VerificationActions";

export default async function VerificationPage() {
  const verifiedUsers = await prisma.user.findMany({
    where: { isVerifiedBiz: true, role: "BUSINESS" },
    select: {
      id: true,
      name: true,
      email: true,
      businessName: true,
      businessNumber: true,
      updatedAt: true,
      _count: { select: { ads: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const unverifiedUsers = await prisma.user.findMany({
    where: {
      role: "BUSINESS",
      isVerifiedBiz: false,
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
    take: 50,
  });

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6">
      <h1 className="text-2xl font-bold">업소 인증 현황</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        사업자 인증은 국세청 API로 자동 처리됩니다. 이 페이지에서는 인증 현황 조회 및 인증 취소/복원이 가능합니다.
      </p>

      <h2 className="mt-6 text-lg font-semibold text-success">인증 완료 ({verifiedUsers.length}건)</h2>
      {verifiedUsers.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">인증된 사업자가 없습니다</p>
      ) : (
        <div className="mt-3 space-y-3">
          {verifiedUsers.map((user) => (
            <div key={user.id} className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">{user.businessName || user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  {user.businessNumber && (
                    <p className="mt-1 text-sm">사업자번호: <span className="font-mono">{user.businessNumber}</span></p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    광고 {user._count.ads}건 · 인증일 {new Date(user.updatedAt).toLocaleDateString("ko-KR")}
                  </p>
                </div>
                <VerificationActions userId={user.id} isVerified={true} />
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="mt-8 text-lg font-semibold text-muted-foreground">미인증 사업자 ({unverifiedUsers.length}건)</h2>
      <p className="mt-1 text-xs text-muted-foreground">사업자 인증을 아직 하지 않은 회원입니다. 광고 등록 시 국세청 API로 자동 인증됩니다.</p>
      {unverifiedUsers.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">미인증 사업자가 없습니다</p>
      ) : (
        <div className="mt-3 space-y-2">
          {unverifiedUsers.map((user) => (
            <div key={user.id} className="rounded-lg border p-3">
              <div className="flex items-start justify-between gap-4">
                <div className="text-sm">
                  <span className="font-medium">{user.businessName || user.name}</span>
                  <span className="ml-2 text-muted-foreground">{user.email}</span>
                  {user.businessNumber && (
                    <span className="ml-2 font-mono text-xs text-muted-foreground">{user.businessNumber}</span>
                  )}
                  <span className="ml-2 text-xs text-muted-foreground">광고 {user._count.ads}건</span>
                </div>
                <VerificationActions userId={user.id} isVerified={false} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
