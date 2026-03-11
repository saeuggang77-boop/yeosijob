import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { XCircle } from "lucide-react";

interface Props {
  searchParams: Promise<{ code?: string; message?: string }>;
}

export default async function PartnerPaymentFailPage({ searchParams }: Props) {
  const sp = await searchParams;
  const errorMessage = sp.message || "결제가 취소되었습니다";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">결제 실패</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-12 text-center">
            <XCircle className="mx-auto h-16 w-16 text-destructive" />
            <h2 className="mt-4 text-xl font-bold">결제가 실패했습니다</h2>
            <p className="mt-2 text-sm text-muted-foreground">{errorMessage}</p>
            <div className="mt-6">
              <Link href="/partner">
                <Button variant="outline">제휴업체 목록으로</Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
