import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { PARTNER_GRADES } from "@/lib/constants/partners";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentWidget } from "@/components/payment/PaymentWidget";
import { Badge } from "@/components/ui/badge";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function PartnerPaymentPage({ params }: PageProps) {
  const { token } = await params;

  const partner = await prisma.partner.findUnique({
    where: { paymentToken: token },
    select: {
      id: true,
      name: true,
      grade: true,
      monthlyPrice: true,
      durationDays: true,
      status: true,
      userId: true,
      isProfileComplete: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (!partner) {
    notFound();
  }

  // If already paid (ACTIVE), redirect to partner management
  if (partner.status === "ACTIVE") {
    redirect("/business/partner");
  }

  const gradeInfo = PARTNER_GRADES[partner.grade];

  // 기존 PENDING Payment 재사용 또는 새로 생성
  let payment = await prisma.payment.findFirst({
    where: {
      partnerId: partner.id,
      status: "PENDING",
    },
    select: { orderId: true },
  });

  if (!payment) {
    const orderId = `PARTNER-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    payment = await prisma.payment.create({
      data: {
        orderId,
        userId: partner.userId,
        partnerId: partner.id,
        amount: partner.monthlyPrice,
        method: "BANK_TRANSFER",
        status: "PENDING",
        itemSnapshot: {
          type: "partner",
          partnerId: partner.id,
          grade: partner.grade,
        },
      },
      select: { orderId: true },
    });
  }

  const orderId = payment.orderId;
  const orderName = `여시잡 제휴업체 ${gradeInfo.label} 입점`;

  const successUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://yeosijob.com"}/partner/pay/${token}/success`;
  const failUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://yeosijob.com"}/partner/pay/${token}/fail`;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-center text-2xl font-bold">제휴업체 입점 결제</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>결제 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">등급</span>
            <Badge style={{ backgroundColor: gradeInfo.color }} className="text-white border-0">
              {gradeInfo.label}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">기간</span>
            <span className="font-medium">{partner.durationDays}일</span>
          </div>
          <div className="flex justify-between border-t pt-3">
            <span className="text-base font-semibold">결제 금액</span>
            <span className="text-lg font-bold text-primary">
              {partner.monthlyPrice.toLocaleString()}원
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>입금 안내 및 증빙 서류</CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentWidget
            orderId={orderId}
            orderName={orderName}
            amount={partner.monthlyPrice}
            customerName={partner.user.name || "고객"}
            customerEmail={partner.user.email || ""}
            successUrl={successUrl}
            failUrl={failUrl}
          />
        </CardContent>
      </Card>

      <div className="mt-4 rounded-lg bg-muted/30 p-4 text-center text-sm text-muted-foreground">
        결제 완료 후 업체 정보를 입력하시면 제휴업체 페이지에 노출됩니다
      </div>
    </div>
  );
}
