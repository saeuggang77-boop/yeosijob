import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PARTNER_CATEGORIES, PARTNER_STATUS_LABELS } from "@/lib/constants/partners";
import { REGIONS } from "@/lib/constants/regions";
import type { PartnerStatus } from "@/generated/prisma/client";

interface PageProps {
  searchParams: Promise<{
    status?: string;
  }>;
}

export default async function AdminPartnersPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const params = await searchParams;
  const statusFilter = params.status as PartnerStatus | undefined;

  const where = statusFilter ? { status: statusFilter } : {};

  const [partners, statusCounts] = await Promise.all([
    prisma.partner.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            email: true,
            name: true,
            businessName: true,
          },
        },
      },
    }),
    prisma.partner.groupBy({
      by: ["status"],
      _count: true,
    }),
  ]);

  const counts = {
    ALL: partners.length,
    PENDING_PAYMENT: statusCounts.find((c) => c.status === "PENDING_PAYMENT")?._count || 0,
    ACTIVE: statusCounts.find((c) => c.status === "ACTIVE")?._count || 0,
    EXPIRED: statusCounts.find((c) => c.status === "EXPIRED")?._count || 0,
    CANCELLED: statusCounts.find((c) => c.status === "CANCELLED")?._count || 0,
  };

  const statusTabs: { value: string; label: string }[] = [
    { value: "ALL", label: `전체 (${counts.ALL})` },
    { value: "PENDING_PAYMENT", label: `결제대기 (${counts.PENDING_PAYMENT})` },
    { value: "ACTIVE", label: `활성 (${counts.ACTIVE})` },
    { value: "EXPIRED", label: `만료 (${counts.EXPIRED})` },
    { value: "CANCELLED", label: `취소 (${counts.CANCELLED})` },
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">제휴업체 관리</h1>
        <Button asChild>
          <Link href="/admin/partners/new">새 업체 등록</Link>
        </Button>
      </div>

      {/* Status Filter Tabs */}
      <div className="mt-6 flex flex-wrap gap-2">
        {statusTabs.map((tab) => (
          <Button
            key={tab.value}
            variant={(!statusFilter && tab.value === "ALL") || statusFilter === tab.value ? "default" : "outline"}
            size="sm"
            asChild
          >
            <Link href={tab.value === "ALL" ? "/admin/partners" : `/admin/partners?status=${tab.value}`}>
              {tab.label}
            </Link>
          </Button>
        ))}
      </div>

      {/* Partner List */}
      <div className="mt-6 space-y-3">
        {partners.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              제휴업체가 없습니다
            </CardContent>
          </Card>
        ) : (
          partners.map((partner) => {
            const categoryInfo = PARTNER_CATEGORIES[partner.category];
            const statusInfo = PARTNER_STATUS_LABELS[partner.status];
            const regionInfo = REGIONS[partner.region];
            const catColor = categoryInfo?.color || "#6b7280";

            return (
              <Link key={partner.id} href={`/admin/partners/${partner.id}`}>
                <Card className="transition-colors hover:border-primary">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="truncate">{partner.name}</span>
                          <Badge variant={statusInfo.variant as any}>
                            {statusInfo.label}
                          </Badge>
                          <Badge style={{ backgroundColor: catColor }} className="text-white border-0">
                            {categoryInfo?.emoji} {categoryInfo?.label}
                          </Badge>
                        </div>
                        <span className="shrink-0 text-lg font-bold">
                          {partner.monthlyPrice.toLocaleString()}원
                        </span>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>
                        <span className="mr-2">{categoryInfo?.emoji}</span>
                        {categoryInfo?.label} · {regionInfo.label}
                      </p>
                      <p className="truncate">
                        사업자: {partner.user.businessName || partner.user.name || partner.user.email}
                      </p>
                      {partner.startDate && partner.endDate && (
                        <p>
                          기간: {new Date(partner.startDate).toLocaleDateString("ko-KR")} ~{" "}
                          {new Date(partner.endDate).toLocaleDateString("ko-KR")}
                        </p>
                      )}
                      <p>
                        등록일: {new Date(partner.createdAt).toLocaleDateString("ko-KR")}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
