import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ orderId?: string }>;
}

export default async function PaymentInfoPage({
  params,
  searchParams,
}: PageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;
  const { orderId } = await searchParams;

  const payment = await prisma.payment.findFirst({
    where: {
      adId: id,
      userId: session.user.id,
      ...(orderId ? { orderId } : {}),
    },
    include: {
      ad: { select: { title: true, businessName: true, totalAmount: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!payment) redirect("/dashboard");

  const snapshot = payment.itemSnapshot as {
    product: { name: string };
    duration: number;
    breakdown: { line: number; upgrade: number; options: number; total: number };
  };

  return (
    <div className="mx-auto max-w-screen-sm px-4 py-8">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl">
          ✓
        </div>
        <h1 className="mt-4 text-2xl font-bold">광고 등록 완료</h1>
        <p className="mt-2 text-muted-foreground">
          아래 계좌로 입금해주시면 광고가 게재됩니다
        </p>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-lg">
            입금 안내
            <Badge variant="secondary">입금 대기</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4 text-center">
            <p className="text-sm text-muted-foreground">입금 계좌</p>
            <p className="mt-1 text-lg font-bold">국민은행 123-456-789012</p>
            <p className="text-sm text-muted-foreground">예금주: 여시알바</p>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">주문번호</span>
              <span className="font-mono text-xs">{payment.orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">광고</span>
              <span>{payment.ad?.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">상품</span>
              <span>
                {snapshot.product.name} ({snapshot.duration}일)
              </span>
            </div>
            <div className="flex justify-between font-bold text-base">
              <span>입금 금액</span>
              <span className="text-primary">
                {payment.amount.toLocaleString()}원
              </span>
            </div>
          </div>

          <div className="rounded-lg bg-orange-50 p-3 text-sm text-orange-700">
            <p className="font-medium">안내 사항</p>
            <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs">
              <li>입금자명은 주문 시 입력한 이름과 동일해야 합니다</li>
              <li>48시간 이내 미입금 시 자동 취소됩니다</li>
              <li>입금 확인 후 영업일 기준 1시간 이내 광고가 게재됩니다</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex gap-3">
        <Link href="/" className="flex-1">
          <Button variant="outline" className="w-full">
            홈으로
          </Button>
        </Link>
        <Link href="/dashboard" className="flex-1">
          <Button className="w-full">광고 관리</Button>
        </Link>
      </div>
    </div>
  );
}
