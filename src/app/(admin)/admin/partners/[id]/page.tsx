import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PARTNER_GRADES, PARTNER_CATEGORIES, PARTNER_STATUS_LABELS } from "@/lib/constants/partners";
import { REGIONS } from "@/lib/constants/regions";
import { PartnerAdminActions } from "@/components/partners/PartnerAdminActions";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AdminPartnerDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const { id } = await params;

  const partner = await prisma.partner.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          email: true,
          name: true,
          phone: true,
          businessName: true,
        },
      },
      payments: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!partner) {
    notFound();
  }

  const gradeInfo = PARTNER_GRADES[partner.grade];
  const categoryInfo = PARTNER_CATEGORIES[partner.category];
  const statusInfo = PARTNER_STATUS_LABELS[partner.status];
  const regionInfo = REGIONS[partner.region];

  const paymentLink = partner.paymentToken
    ? `${process.env.NEXT_PUBLIC_BASE_URL || "https://yeosijob.com"}/partner/pay/${partner.paymentToken}`
    : null;

  return (
    <div>
      <div className="mb-6">
        <Button variant="outline" asChild>
          <Link href="/admin/partners">← 목록으로</Link>
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{partner.name}</h1>
        <div className="flex items-center gap-2">
          <Badge variant={statusInfo.variant as any}>{statusInfo.label}</Badge>
          <Badge style={{ backgroundColor: gradeInfo.color }}>{gradeInfo.label}</Badge>
        </div>
      </div>

      {/* Partner Info */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>업체 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">업종:</span>{" "}
              <span>{categoryInfo.emoji} {categoryInfo.label}</span>
            </div>
            <div>
              <span className="text-muted-foreground">지역:</span>{" "}
              <span>{regionInfo.label}</span>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">사업자 인증:</span>{" "}
              {partner.isVerifiedBiz ? (
                <>
                  <Badge className="bg-green-100 text-green-700 text-[10px]">인증완료</Badge>
                  <span className="ml-2">{partner.businessNumber} · {partner.bizOwnerName}</span>
                </>
              ) : (
                <Badge variant="outline" className="text-[10px]">미인증</Badge>
              )}
            </div>
            {partner.address && (
              <div className="col-span-2">
                <span className="text-muted-foreground">주소:</span>{" "}
                <span>{partner.address}</span>
              </div>
            )}
            <div className="col-span-2">
              <span className="text-muted-foreground">소개:</span>{" "}
              <p className="mt-1 whitespace-pre-wrap">{partner.description}</p>
            </div>
            {partner.highlight && (
              <div className="col-span-2">
                <span className="text-muted-foreground">광고 제목:</span>{" "}
                <span>{partner.highlight}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contact Info */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>연락처</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {partner.contactPhone && (
            <p>
              <span className="text-muted-foreground">전화:</span> {partner.contactPhone}
            </p>
          )}
          {partner.contactKakao && (
            <p>
              <span className="text-muted-foreground">카카오톡:</span> {partner.contactKakao}
            </p>
          )}
          {partner.websiteUrl && (
            <p>
              <span className="text-muted-foreground">홈페이지:</span>{" "}
              <a href={partner.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                {partner.websiteUrl}
              </a>
            </p>
          )}
          {partner.businessHours && (
            <p>
              <span className="text-muted-foreground">영업시간:</span> {partner.businessHours}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Business User Info */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>사업자 계정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">이메일:</span> {partner.user.email}
          </p>
          <p>
            <span className="text-muted-foreground">이름:</span> {partner.user.name || "-"}
          </p>
          <p>
            <span className="text-muted-foreground">업체명:</span> {partner.user.businessName || "-"}
          </p>
          {partner.user.phone && (
            <p>
              <span className="text-muted-foreground">전화:</span> {partner.user.phone}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Pricing & Period */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>가격 및 기간</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">등급:</span> {gradeInfo.label}
          </p>
          <p>
            <span className="text-muted-foreground">월 금액:</span> {partner.monthlyPrice.toLocaleString()}원
          </p>
          <p>
            <span className="text-muted-foreground">기간:</span> {partner.durationDays}일
          </p>
          {partner.startDate && partner.endDate && (
            <>
              <p>
                <span className="text-muted-foreground">시작일:</span>{" "}
                {new Date(partner.startDate).toLocaleDateString("ko-KR")}
              </p>
              <p>
                <span className="text-muted-foreground">종료일:</span>{" "}
                {new Date(partner.endDate).toLocaleDateString("ko-KR")}
              </p>
            </>
          )}
          <p>
            <span className="text-muted-foreground">등록일:</span>{" "}
            {new Date(partner.createdAt).toLocaleDateString("ko-KR")}
          </p>
        </CardContent>
      </Card>

      {/* Stats */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>통계</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">조회수:</span> {partner.viewCount.toLocaleString()}
          </p>
          <p>
            <span className="text-muted-foreground">클릭수:</span> {partner.clickCount.toLocaleString()}
          </p>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>결제 내역</CardTitle>
        </CardHeader>
        <CardContent>
          {partner.payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">결제 내역이 없습니다</p>
          ) : (
            <div className="space-y-2">
              {partner.payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div className="text-sm">
                    <p className="font-medium">{payment.amount.toLocaleString()}원</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(payment.createdAt).toLocaleDateString("ko-KR")}
                    </p>
                  </div>
                  <Badge variant={payment.status === "APPROVED" ? "default" : "secondary"}>
                    {payment.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin Actions */}
      <div className="mt-6">
        <PartnerAdminActions partner={partner} paymentLink={paymentLink} />
      </div>
    </div>
  );
}
