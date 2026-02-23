import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JumpButton } from "@/components/dashboard/JumpButton";
import { VerificationCard } from "@/components/dashboard/VerificationCard";

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  ACTIVE: { label: "게재중", variant: "default" },
  PENDING_DEPOSIT: { label: "입금대기", variant: "secondary" },
  PENDING_REVIEW: { label: "검토중", variant: "secondary" },
  EXPIRED: { label: "만료", variant: "outline" },
  CANCELLED: { label: "취소", variant: "destructive" },
  REJECTED: { label: "반려", variant: "destructive" },
  DRAFT: { label: "임시저장", variant: "outline" },
  PENDING_PAYMENT: { label: "결제대기", variant: "secondary" },
  PAUSED: { label: "일시정지", variant: "outline" },
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [user, ads] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { businessNumber: true, isVerifiedBiz: true },
    }),
    prisma.ad.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        status: true,
        productId: true,
        totalAmount: true,
        viewCount: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        manualJumpPerDay: true,
        manualJumpUsedToday: true,
        lastManualJumpAt: true,
        editCount: true,
        maxEdits: true,
      },
    }),
  ]);

  const activeCount = ads.filter((a) => a.status === "ACTIVE").length;
  const totalViews = ads.reduce((sum, a) => sum + a.viewCount, 0);
  const hasFreeAd = ads.some((a) => a.status === "ACTIVE" && a.productId === "FREE");

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">광고 관리</h1>
        <Link href="/business/ads/new">
          <Button>새 광고 등록</Button>
        </Link>
      </div>

      {/* 업소 인증 카드 */}
      <div className="mt-6">
        <VerificationCard
          businessNumber={user?.businessNumber || null}
          isVerified={user?.isVerifiedBiz || false}
        />
      </div>

      {/* FREE 광고 업그레이드 배너 */}
      {hasFreeAd && (
        <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
          <p className="font-medium">내 무료 광고가 리스트 최하단에 있습니다</p>
          <p className="mt-1 text-sm text-muted-foreground">줄광고로 업그레이드하면 자동점프로 상위 노출됩니다</p>
          <Link href="/business/ads/new">
            <Button size="sm" className="mt-2">업그레이드하기</Button>
          </Link>
        </div>
      )}

      {/* 요약 카드 */}
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Card className="animate-fade-in-up bg-gradient-to-br from-primary/10 to-transparent stagger-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              게재중 광고
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{activeCount}건</p>
          </CardContent>
        </Card>
        <Card className="animate-fade-in-up stagger-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              전체 광고
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{ads.length}건</p>
          </CardContent>
        </Card>
        <Card className="animate-fade-in-up stagger-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              총 조회수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">
              {totalViews.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 광고 리스트 */}
      <div className="mt-6">
        {ads.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <p className="text-lg">등록된 광고가 없습니다</p>
              <p className="mt-1 text-sm">첫 광고를 등록해보세요!</p>
              <Link href="/business/ads/new" className="mt-4 inline-block">
                <Button>광고 등록하기</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {ads.map((ad) => {
              const statusInfo = STATUS_LABELS[ad.status] || {
                label: ad.status,
                variant: "outline" as const,
              };
              return (
                <Card key={ad.id} className="transition-colors hover:bg-muted/50">
                  <CardContent className="py-4">
                    <Link href={`/business/ads/${ad.id}/payment`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="truncate font-medium">{ad.title}</span>
                            <Badge variant={statusInfo.variant}>
                              {statusInfo.label}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            조회 {ad.viewCount.toLocaleString()}회 ·{" "}
                            {ad.productId === "FREE" ? "무료" : `${ad.totalAmount.toLocaleString()}원`}
                            {ad.productId === "FREE" && " · 유료 전용"}
                          </p>
                        </div>
                      </div>
                    </Link>
                    {ad.status === "ACTIVE" && (
                      <div className="mt-2 flex flex-wrap items-center gap-2 border-t pt-2">
                        {ad.productId === "FREE" ? (
                          <Button size="sm" variant="outline" className="text-xs" disabled>
                            수동점프 (유료 전용)
                          </Button>
                        ) : (
                          ad.manualJumpPerDay > 0 && (
                            <JumpButton
                              adId={ad.id}
                              manualJumpPerDay={ad.manualJumpPerDay}
                              manualJumpUsedToday={ad.manualJumpUsedToday}
                              lastManualJumpAt={ad.lastManualJumpAt?.toISOString() ?? null}
                            />
                          )
                        )}
                        <Link href={`/business/ads/${ad.id}/stats`}>
                          <Button size="sm" variant="outline" className="text-xs">
                            통계
                          </Button>
                        </Link>
                        {ad.productId === "FREE" ? (
                          <Link href={`/business/ads/${ad.id}/edit`}>
                            <Button size="sm" variant="ghost" className="text-xs">
                              수정 (무제한)
                            </Button>
                          </Link>
                        ) : (
                          ad.editCount < ad.maxEdits && (
                            <Link href={`/business/ads/${ad.id}/edit`}>
                              <Button size="sm" variant="ghost" className="text-xs">
                                수정 ({ad.maxEdits - ad.editCount}회 남음)
                              </Button>
                            </Link>
                          )
                        )}
                      </div>
                    )}
                    {ad.status === "EXPIRED" && ad.productId !== "FREE" && (
                      <div className="mt-2 flex flex-wrap items-center gap-2 border-t pt-2">
                        <Link href={`/business/ads/${ad.id}/renew`}>
                          <Button size="sm" variant="default" className="text-xs">
                            광고 연장하기
                          </Button>
                        </Link>
                        <Link href={`/business/ads/${ad.id}/stats`}>
                          <Button size="sm" variant="outline" className="text-xs">
                            통계
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
