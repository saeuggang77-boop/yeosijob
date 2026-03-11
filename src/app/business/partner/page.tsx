import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PARTNER_GRADES, PARTNER_CATEGORIES, PARTNER_STATUS_LABELS } from "@/lib/constants/partners";
import { REGIONS } from "@/lib/constants/regions";
import { PartnerRenewButton } from "@/components/partners/PartnerRenewButton";

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

  return (
    <div>
      <h1 className="text-2xl font-bold">제휴업체 관리</h1>

      <div className="mt-6 space-y-4">
        {partners.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              제휴업체가 없습니다
            </CardContent>
          </Card>
        ) : (
          partners.map((partner) => {
            const gradeInfo = PARTNER_GRADES[partner.grade];
            const categoryInfo = PARTNER_CATEGORIES[partner.category];
            const statusInfo = PARTNER_STATUS_LABELS[partner.status];
            const regionInfo = REGIONS[partner.region];
            const remainingDays = partner.endDate ? getRemainingDays(partner.endDate) : null;

            const paymentLink = partner.paymentToken
              ? `${process.env.NEXT_PUBLIC_BASE_URL || "https://yeosijob.com"}/partner/pay/${partner.paymentToken}`
              : null;

            return (
              <Card key={partner.id}>
                <CardHeader>
                  <CardTitle className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span>{partner.name}</span>
                      <Badge variant={statusInfo.variant as any}>
                        {statusInfo.label}
                      </Badge>
                      <Badge style={{ backgroundColor: gradeInfo.color }}>
                        {gradeInfo.label}
                      </Badge>
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
                      <span className="text-muted-foreground">월 금액:</span>{" "}
                      {partner.monthlyPrice.toLocaleString()}원
                    </p>
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

                  {/* Actions based on status */}
                  <div className="flex flex-wrap gap-2">
                    {partner.status === "ACTIVE" && remainingDays !== null && remainingDays < 30 && (
                      <PartnerRenewButton partnerId={partner.id} label="연장" />
                    )}

                    {partner.status === "EXPIRED" && (
                      <PartnerRenewButton partnerId={partner.id} label="연장 결제" />
                    )}

                    {partner.status === "PENDING_PAYMENT" && paymentLink && (
                      <Button size="sm" asChild>
                        <a href={paymentLink} target="_blank" rel="noopener noreferrer">
                          결제하기
                        </a>
                      </Button>
                    )}
                  </div>

                  {/* Payment link for PENDING_PAYMENT */}
                  {partner.status === "PENDING_PAYMENT" && paymentLink && (
                    <div className="rounded-md border bg-muted/50 p-3">
                      <p className="mb-2 text-xs font-medium text-muted-foreground">결제 대기 중</p>
                      <p className="break-all font-mono text-xs">{paymentLink}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
