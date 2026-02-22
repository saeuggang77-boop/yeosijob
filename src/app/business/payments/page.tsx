import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STATUS_LABELS: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  PENDING: { label: "입금대기", variant: "secondary" },
  APPROVED: { label: "승인", variant: "default" },
  FAILED: { label: "실패", variant: "destructive" },
  CANCELLED: { label: "취소", variant: "destructive" },
  REFUNDED: { label: "환불", variant: "outline" },
};

export default async function BusinessPaymentsPage() {
  const session = await auth();
  if (!session || session.user.role !== "BUSINESS") {
    redirect("/login");
  }

  const payments = await prisma.payment.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      ad: { select: { id: true, title: true } },
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">결제 내역</h1>

      <div className="mt-6 space-y-3">
        {payments.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              결제 내역이 없습니다
            </CardContent>
          </Card>
        ) : (
          payments.map((payment) => {
            const statusInfo = STATUS_LABELS[payment.status] || {
              label: payment.status,
              variant: "outline" as const,
            };

            return (
              <Card key={payment.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="truncate">{payment.ad?.title || "삭제된 광고"}</span>
                        <Badge variant={statusInfo.variant}>
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <span className="shrink-0 text-lg font-bold">
                        {payment.amount.toLocaleString()}원
                      </span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p className="truncate">
                      주문번호: <span className="font-mono text-xs">{payment.orderId}</span>
                    </p>
                    <p>
                      주문일: {payment.createdAt.toLocaleString("ko-KR")}
                      {payment.paidAt &&
                        ` · 승인: ${payment.paidAt.toLocaleString("ko-KR")}`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
