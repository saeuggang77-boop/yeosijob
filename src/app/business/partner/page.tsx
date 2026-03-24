import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PARTNER_CATEGORIES, PARTNER_STATUS_LABELS } from "@/lib/constants/partners";
import { REGIONS } from "@/lib/constants/regions";
import { PartnerRenewButton } from "@/components/partners/PartnerRenewButton";
import { PartnerRegisterForm } from "@/components/partners/PartnerRegisterForm";

export default async function BusinessPartnerPage() {
  const session = await auth();

  if (!session || (session.user.role !== "BUSINESS" && session.user.role !== "ADMIN")) {
    redirect("/login");
  }

  const partners = await prisma.partner.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  const getRemainingDays = (endDate: Date) => {
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getAutoStartRemaining = (startDate: Date) => {
    const autoStart = new Date(startDate);
    autoStart.setDate(autoStart.getDate() + 3);
    const now = new Date();
    const diff = autoStart.getTime() - now.getTime();
    const hours = Math.ceil(diff / (1000 * 60 * 60));
    if (hours <= 0) return "곧 자동 시작";
    const days = Math.floor(hours / 24);
    const remainHours = hours % 24;
    if (days > 0) return `${days}일 ${remainHours}시간 남음`;
    return `${remainHours}시간 남음`;
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">제휴업체 관리</h1>

      {/* 기존 제휴업체 목록 */}
      {partners.length > 0 && (
        <div className="mt-6 space-y-4">
          {partners.map((partner) => {
            const categoryInfo = PARTNER_CATEGORIES[partner.category];
            const statusInfo = PARTNER_STATUS_LABELS[partner.status];
            const regionInfo = REGIONS[partner.region];
            const remainingDays = partner.endDate ? getRemainingDays(partner.endDate) : null;

            return (
              <Card key={partner.id}>
                <CardHeader>
                  <CardTitle className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span>{partner.name}</span>
                      <Badge variant={statusInfo.variant as any}>
                        {statusInfo.label}
                      </Badge>
                      <Badge style={{ backgroundColor: categoryInfo.color }} className="text-white border-0">
                        {categoryInfo.emoji} {categoryInfo.label}
                      </Badge>
                      {partner.isVerifiedBiz ? (
                        <Badge className="bg-green-100 text-green-700 text-[10px]">인증</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">미인증</Badge>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-muted-foreground">업종:</span>{" "}
                      {categoryInfo.emoji} {categoryInfo.label} · {regionInfo.label}
                    </p>
                    <p>
                      <span className="text-muted-foreground">금액:</span>{" "}
                      {partner.monthlyPrice.toLocaleString()}원
                    </p>
                    {partner.status === "ACTIVE" && !partner.endDate && partner.startDate && (
                      <div className="rounded-md border border-blue-500/30 bg-blue-500/10 p-3">
                        <p className="text-sm font-medium text-blue-400">
                          ⏸ 기간 대기 중
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          업체 정보를 입력하면 그때부터 {partner.durationDays}일이 시작됩니다.
                          <br />
                          미입력 시 자동 시작까지{" "}
                          <span className="font-semibold text-blue-300">
                            {getAutoStartRemaining(partner.startDate)}
                          </span>
                        </p>
                      </div>
                    )}
                    {partner.startDate && partner.endDate && (
                      <>
                        <p>
                          <span className="text-muted-foreground">기간:</span>{" "}
                          {new Date(partner.startDate).toLocaleDateString("ko-KR")} ~{" "}
                          {new Date(partner.endDate).toLocaleDateString("ko-KR")}
                        </p>
                        {remainingDays !== null && (
                          <p>
                            <span className="text-muted-foreground">남은 기간:</span>{" "}
                            <span className={remainingDays < 7 ? "font-bold text-red-500" : ""}>
                              {remainingDays > 0 ? `${remainingDays}일` : "만료"}
                            </span>
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  {/* 프로필 미완성 안내 */}
                  {!partner.isProfileComplete && partner.status === "ACTIVE" && (
                    <div className="rounded-md border border-yellow-500/30 bg-yellow-500/10 p-3">
                      <p className="text-sm font-medium text-yellow-500">
                        업체 정보를 입력해주세요
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        정보를 입력해야 제휴업체 페이지에 노출됩니다
                      </p>
                      <Button size="sm" className="mt-2" asChild>
                        <Link href={`/business/partner/${partner.id}/edit`}>
                          정보 입력하기
                        </Link>
                      </Button>
                    </div>
                  )}

                  {/* 사업자 미인증 안내 */}
                  {!partner.isVerifiedBiz && partner.status === "ACTIVE" && (
                    <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3">
                      <p className="text-sm font-medium text-amber-500">사업자 인증을 완료해주세요</p>
                      <p className="mt-1 text-xs text-muted-foreground">사업자등록증 정보를 입력하면 인증업체 뱃지가 부여됩니다</p>
                      <Button size="sm" variant="outline" className="mt-2" asChild>
                        <Link href={`/business/partner/${partner.id}/edit`}>인증하기</Link>
                      </Button>
                    </div>
                  )}

                  {/* Actions based on status */}
                  <div className="flex flex-wrap gap-2">
                    {partner.status === "ACTIVE" && partner.isProfileComplete && (
                      <>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/partner/${partner.id}`} target="_blank">
                            내 광고 보기
                          </Link>
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/business/partner/${partner.id}/edit`}>
                            정보 수정
                          </Link>
                        </Button>
                      </>
                    )}

                    {partner.status === "ACTIVE" && remainingDays !== null && remainingDays < 30 && (
                      <PartnerRenewButton partnerId={partner.id} label="연장" />
                    )}

                    {partner.status === "EXPIRED" && (
                      <PartnerRenewButton partnerId={partner.id} label="연장 결제" />
                    )}

                    {partner.status === "PENDING_PAYMENT" && partner.paymentToken && (
                      <Button size="sm" asChild>
                        <Link href={`/partner/pay/${partner.paymentToken}`}>
                          결제하기
                        </Link>
                      </Button>
                    )}
                  </div>

                  {/* Payment link for PENDING_PAYMENT */}
                  {partner.status === "PENDING_PAYMENT" && partner.paymentToken && (
                    <div className="rounded-md border bg-muted/50 p-3">
                      <p className="mb-2 text-xs font-medium text-muted-foreground">결제 대기 중 - 아래 계좌로 입금해주세요</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 셀프 등록 폼 */}
      <div className="mt-8">
        <PartnerRegisterForm />
      </div>

      <div className="mt-4 text-center">
        <Link href="/partner" className="text-sm text-primary hover:underline">
          제휴업체 페이지 둘러보기 →
        </Link>
      </div>
    </div>
  );
}
