import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JumpButton } from "@/components/dashboard/JumpButton";
import { VerificationCard } from "@/components/dashboard/VerificationCard";
import { DeleteAdButton } from "@/components/dashboard/DeleteAdButton";
import { AD_PRODUCTS } from "@/lib/constants/products";

const PRODUCT_BADGE_STYLES: Record<string, string> = {
  FREE: "bg-zinc-600/20 text-zinc-400 border-zinc-600/40",
  LINE: "bg-slate-500/20 text-slate-300 border-slate-500/40",
  RECOMMEND: "bg-teal-500/20 text-teal-400 border-teal-500/40",
  URGENT: "bg-orange-500/20 text-orange-400 border-orange-500/40",
  SPECIAL: "bg-blue-500/20 text-blue-400 border-blue-500/40",
  PREMIUM: "bg-purple-500/20 text-purple-400 border-purple-500/40",
  VIP: "bg-amber-500/20 text-amber-400 border-amber-500/40",
  BANNER: "bg-amber-500/30 text-amber-300 border-amber-500/50 font-bold",
};

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

interface DashboardPageProps {
  searchParams: Promise<{
    status?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const params = await searchParams;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      businessNumber: true,
      isVerifiedBiz: true,
      bizOwnerName: true,
      isStaff: true,
    },
  });

  if (!user) redirect("/login");

  // 스탭 분기: 페이지네이션/필터/검색 지원하는 별도 렌더
  if (user.isStaff) {
    const statusFilter = params.status || "ALL";
    const searchQuery = params.search || "";
    const currentPage = Math.max(1, parseInt(params.page || "1", 10) || 1);
    return renderStaffDashboard(session.user.id, user, {
      statusFilter,
      searchQuery,
      currentPage,
      pageSize: 20,
    });
  }

  const ads = await prisma.ad.findMany({
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
      _count: {
        select: { scraps: true },
      },
    },
  });

  const activeCount = ads.filter((a) => a.status === "ACTIVE").length;
  const totalViews = ads.reduce((sum, a) => sum + a.viewCount, 0);
  const totalScraps = ads.reduce((sum, a) => sum + a._count.scraps, 0);

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
          bizOwnerName={user?.bizOwnerName || null}
        />
      </div>


      {/* 요약 카드 */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="animate-fade-in-up bg-gradient-to-br from-primary/10 to-transparent stagger-1">
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
        <Card className="animate-fade-in-up bg-gradient-to-br from-pink-500/10 to-transparent stagger-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              💝 받은 찜
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{totalScraps.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="animate-fade-in-up stagger-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              게재중 광고
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{activeCount}건</p>
          </CardContent>
        </Card>
        <Card className="animate-fade-in-up stagger-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              전체 광고
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{ads.length}건</p>
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
              const statusInfo = STATUS_LABELS[ad.status];
              const isFree = ad.productId === "FREE";
              const now = new Date();
              const daysLeft = ad.endDate ? Math.ceil((new Date(ad.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
              const isUrgent = daysLeft !== null && daysLeft <= 2;
              const isWarn = daysLeft !== null && daysLeft > 2 && daysLeft <= 7;
              const showRenew = ad.status === "ACTIVE" && !isFree && daysLeft !== null && daysLeft <= 7;
              return (
                <Card key={ad.id} className="transition-colors hover:bg-muted/50">
                  <CardContent className="py-4">
                    <Link href={`/business/ads/${ad.id}/payment`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="truncate font-medium">{ad.title}</span>
                            <Badge variant={statusInfo?.variant || "outline"}>
                              {statusInfo?.label || ad.status}
                            </Badge>
                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${PRODUCT_BADGE_STYLES[ad.productId] || "bg-muted text-muted-foreground border-muted"}`}>
                              {AD_PRODUCTS[ad.productId]?.name || ad.productId}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            조회 {ad.viewCount.toLocaleString()}회 ·{" "}
                            {ad._count.scraps > 0 ? (
                              <span className="text-pink-400">💝 {ad._count.scraps}</span>
                            ) : (
                              <span>💝 0</span>
                            )}
                            {" · "}
                            {isFree ? "무료" : `${ad.totalAmount.toLocaleString()}원`}
                          </p>
                          {ad.status === "ACTIVE" && (
                            <p className={`mt-1 text-xs ${isFree ? "text-green-500" : isUrgent ? "font-medium text-destructive" : isWarn ? "text-amber-500" : "text-muted-foreground"}`}>
                              {isFree
                                ? "무제한"
                                : ad.endDate
                                  ? `${new Date(ad.endDate).toLocaleDateString("ko-KR")} 마감 · D-${daysLeft}${isUrgent ? " (곧 만료!)" : isWarn ? " (곧 만료)" : ""}`
                                  : ""}
                            </p>
                          )}
                          {ad.status === "EXPIRED" && ad.endDate && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {new Date(ad.endDate).toLocaleDateString("ko-KR")} 만료됨
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                    {ad.status === "ACTIVE" && (
                      <div className="mt-2 flex flex-wrap items-center gap-2 border-t pt-2">
                        {ad.manualJumpPerDay > 0 && (
                          <JumpButton
                            adId={ad.id}
                            manualJumpPerDay={ad.manualJumpPerDay}
                            manualJumpUsedToday={ad.manualJumpUsedToday}
                            lastManualJumpAt={ad.lastManualJumpAt?.toISOString() ?? null}
                          />
                        )}
                        <Link href={`/business/ads/${ad.id}/stats`}>
                          <Button size="sm" variant="outline" className="text-xs">
                            통계
                          </Button>
                        </Link>
                        <Link href={`/business/ads/${ad.id}/edit`}>
                          <Button size="sm" variant="ghost" className="text-xs">
                            수정
                          </Button>
                        </Link>
                        {ad.productId !== "BANNER" && (
                          <Link href={`/business/ads/${ad.id}/upgrade`}>
                            <Button size="sm" className="text-xs bg-primary text-primary-foreground font-bold hover:bg-primary/90">
                              업그레이드
                            </Button>
                          </Link>
                        )}
                        {showRenew && (
                          <Link href={`/business/ads/${ad.id}/renew`}>
                            <Button size="sm" variant="outline" className="text-xs border-amber-500/40 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20">
                              연장하기
                            </Button>
                          </Link>
                        )}
                        <DeleteAdButton
                          adId={ad.id}
                          isPaidActive={ad.productId !== "FREE"}
                        />
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
                        <DeleteAdButton adId={ad.id} isPaidActive={false} />
                      </div>
                    )}
                    {ad.status !== "ACTIVE" && !(ad.status === "EXPIRED" && ad.productId !== "FREE") && (
                      <div className="mt-2 flex flex-wrap items-center gap-2 border-t pt-2">
                        <DeleteAdButton adId={ad.id} isPaidActive={false} />
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

// ─────────────────────────────────────────────
// 스탭 계정 전용 대시보드 (페이지네이션 + 필터 + 검색)
// - 업그레이드/연장 버튼 없음
// - 카드 클릭 시 /business/ads/[id] (광고 상세)로 이동 (결제 페이지 아님)
// ─────────────────────────────────────────────
async function renderStaffDashboard(
  userId: string,
  user: { businessNumber: string | null; isVerifiedBiz: boolean; bizOwnerName: string | null },
  opts: { statusFilter: string; searchQuery: string; currentPage: number; pageSize: number }
) {
  const { statusFilter, searchQuery, currentPage, pageSize } = opts;

  const where: Record<string, unknown> = { userId };
  if (statusFilter !== "ALL") {
    where.status = statusFilter;
  }
  if (searchQuery) {
    where.OR = [
      { title: { contains: searchQuery, mode: "insensitive" } },
      { businessName: { contains: searchQuery, mode: "insensitive" } },
    ];
  }

  const [ads, total, activeCount, totalViewsAgg, totalScraps] = await Promise.all([
    prisma.ad.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
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
        autoRenewCount: true,
        _count: {
          select: { scraps: true },
        },
      },
    }),
    prisma.ad.count({ where }),
    prisma.ad.count({ where: { userId, status: "ACTIVE" } }),
    prisma.ad.aggregate({ where: { userId }, _sum: { viewCount: true } }),
    prisma.scrap.count({ where: { ad: { userId } } }),
  ]);

  const totalViews = totalViewsAgg._sum.viewCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const buildPageUrl = (page: number) => {
    const qs = new URLSearchParams();
    if (statusFilter !== "ALL") qs.set("status", statusFilter);
    if (searchQuery) qs.set("search", searchQuery);
    if (page > 1) qs.set("page", String(page));
    const query = qs.toString();
    return query ? `/business/dashboard?${query}` : `/business/dashboard`;
  };

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">광고 관리 (운영자)</h1>
        <Link href="/business/ads/new">
          <Button>새 광고 등록</Button>
        </Link>
      </div>

      <div className="mt-6">
        <VerificationCard
          businessNumber={user.businessNumber || null}
          isVerified={user.isVerifiedBiz || false}
          bizOwnerName={user.bizOwnerName || null}
        />
      </div>

      {/* 요약 카드 */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-primary/10 to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">총 조회수</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{totalViews.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-pink-500/10 to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">💝 받은 찜</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{totalScraps.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">게재중 광고</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{activeCount}건</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">전체 광고</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{total}건</p>
          </CardContent>
        </Card>
      </div>

      {/* 상태 필터 + 검색 폼 */}
      <form method="GET" className="my-4 flex flex-wrap items-center gap-2">
        <select
          name="status"
          defaultValue={statusFilter}
          className="rounded border bg-background px-3 py-2 text-sm"
        >
          <option value="ALL">전체</option>
          <option value="ACTIVE">게재중</option>
          <option value="EXPIRED">만료</option>
          <option value="CANCELLED">취소</option>
          <option value="PENDING_DEPOSIT">입금대기</option>
          <option value="DRAFT">임시저장</option>
        </select>
        <input
          type="text"
          name="search"
          defaultValue={searchQuery}
          placeholder="제목 / 사업체명 검색"
          className="flex-1 min-w-[200px] rounded border bg-background px-3 py-2 text-sm"
        />
        <Button type="submit" size="sm">검색</Button>
        {(statusFilter !== "ALL" || searchQuery) && (
          <Link href="/business/dashboard">
            <Button type="button" size="sm" variant="ghost">초기화</Button>
          </Link>
        )}
      </form>

      {/* 광고 리스트 */}
      <div className="mt-2">
        {ads.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <p className="text-lg">조건에 맞는 광고가 없습니다</p>
              <Link href="/business/ads/new" className="mt-4 inline-block">
                <Button>광고 등록하기</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {ads.map((ad) => {
              const statusInfo = STATUS_LABELS[ad.status];
              const isFree = ad.productId === "FREE";
              const now = new Date();
              const daysLeft = ad.endDate
                ? Math.ceil((new Date(ad.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                : null;
              return (
                <Card key={ad.id} className="transition-colors hover:bg-muted/50">
                  <CardContent className="py-4">
                    <Link href={`/business/ads/${ad.id}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="truncate font-medium">{ad.title}</span>
                            <Badge variant={statusInfo?.variant || "outline"}>
                              {statusInfo?.label || ad.status}
                            </Badge>
                            <span
                              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${
                                PRODUCT_BADGE_STYLES[ad.productId] ||
                                "bg-muted text-muted-foreground border-muted"
                              }`}
                            >
                              {AD_PRODUCTS[ad.productId]?.name || ad.productId}
                            </span>
                            {ad.autoRenewCount > 0 && (
                              <span className="inline-flex items-center rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-400">
                                자동갱신 {ad.autoRenewCount}/3
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            조회 {ad.viewCount.toLocaleString()}회 ·{" "}
                            {ad._count.scraps > 0 ? (
                              <span className="text-pink-400">💝 {ad._count.scraps}</span>
                            ) : (
                              <span>💝 0</span>
                            )}
                            {" · "}
                            등록 {new Date(ad.createdAt).toLocaleDateString("ko-KR")}
                          </p>
                          {ad.status === "ACTIVE" && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {isFree
                                ? "무제한"
                                : ad.endDate
                                  ? `${new Date(ad.endDate).toLocaleDateString("ko-KR")} 마감 · D-${daysLeft}`
                                  : ""}
                            </p>
                          )}
                          {ad.status === "EXPIRED" && ad.endDate && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {new Date(ad.endDate).toLocaleDateString("ko-KR")} 만료됨
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                    {/* 스탭 액션: 수정/통계/삭제만 (업그레이드/연장 없음) */}
                    {ad.status === "ACTIVE" && (
                      <div className="mt-2 flex flex-wrap items-center gap-2 border-t pt-2">
                        {ad.manualJumpPerDay > 0 && (
                          <JumpButton
                            adId={ad.id}
                            manualJumpPerDay={ad.manualJumpPerDay}
                            manualJumpUsedToday={ad.manualJumpUsedToday}
                            lastManualJumpAt={ad.lastManualJumpAt?.toISOString() ?? null}
                          />
                        )}
                        <Link href={`/business/ads/${ad.id}/stats`}>
                          <Button size="sm" variant="outline" className="text-xs">
                            통계
                          </Button>
                        </Link>
                        <Link href={`/business/ads/${ad.id}/edit`}>
                          <Button size="sm" variant="ghost" className="text-xs">
                            수정
                          </Button>
                        </Link>
                        <DeleteAdButton adId={ad.id} isPaidActive={false} />
                      </div>
                    )}
                    {ad.status !== "ACTIVE" && (
                      <div className="mt-2 flex flex-wrap items-center gap-2 border-t pt-2">
                        <Link href={`/business/ads/${ad.id}/stats`}>
                          <Button size="sm" variant="outline" className="text-xs">
                            통계
                          </Button>
                        </Link>
                        <DeleteAdButton adId={ad.id} isPaidActive={false} />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* 인라인 페이지네이션 */}
      {total > pageSize && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {currentPage > 1 && (
            <Link href={buildPageUrl(currentPage - 1)}>
              <Button size="sm" variant="outline">이전</Button>
            </Link>
          )}
          <span className="text-sm text-muted-foreground">
            {currentPage} / {totalPages}
          </span>
          {currentPage < totalPages && (
            <Link href={buildPageUrl(currentPage + 1)}>
              <Button size="sm" variant="outline">다음</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
