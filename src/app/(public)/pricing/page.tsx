import { auth } from "@/lib/auth";
import { AD_PRODUCTS, AD_OPTIONS, type DurationDays } from "@/lib/constants/products";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default async function PricingPage() {
  const session = await auth();

  const formatPrice = (amount: number): string => {
    if (amount === 0) return "0원";
    if (amount === 9999) return "무제한";
    return `${(amount / 10000).toLocaleString()}만원`;
  };

  const formatNumber = (num: number): string => {
    if (num === 9999) return "무제한";
    return num.toString();
  };

  // Order: BANNER → VIP → PREMIUM → SPECIAL → URGENT → RECOMMEND → LINE → FREE
  const tierOrder = ["BANNER", "VIP", "PREMIUM", "SPECIAL", "URGENT", "RECOMMEND", "LINE", "FREE"];
  const orderedTiers = tierOrder.map((id) => AD_PRODUCTS[id]);

  const getTierRowClass = (id: string): string => {
    const baseClass = "border-b hover:bg-muted/5 transition-colors";
    switch (id) {
      case "BANNER":
        return `${baseClass} bg-gradient-to-r from-primary/15 to-accent/10 border-l-4 border-l-primary`;
      case "VIP":
        return `${baseClass} bg-gradient-to-r from-primary/10 to-accent/5 border-l-4 border-l-primary/70`;
      case "PREMIUM":
        return `${baseClass} bg-primary/5 border-l-4 border-l-primary/50`;
      case "SPECIAL":
        return `${baseClass} border-l-4 border-l-[#9333EA] bg-[#9333EA]/5`;
      case "URGENT":
        return `${baseClass} border-l-4 border-l-[#EF4444] bg-[#EF4444]/5`;
      case "RECOMMEND":
        return `${baseClass} border-l-4 border-l-[#3B82F6] bg-[#3B82F6]/5`;
      case "LINE":
        return `${baseClass} bg-card`;
      case "FREE":
        return `${baseClass} bg-muted/30`;
      default:
        return baseClass;
    }
  };

  const addOnOrder = ["BOLD", "ICON", "HIGHLIGHT", "KAKAO_ALERT"];
  const orderedAddOns = addOnOrder.map((id) => AD_OPTIONS[id as keyof typeof AD_OPTIONS]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">광고 등급 안내</h1>
        <p className="text-xl text-muted-foreground">
          비즈니스 목적에 맞는 광고 등급을 선택하세요
        </p>
      </div>

      {/* Main Product Tiers Table */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle className="text-2xl">광고 등급별 비교</CardTitle>
          <CardDescription>
            등급에 따라 노출 위치, 점프 횟수, 이력서 열람 기능이 달라집니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="border-b-2 bg-muted/50">
                  <th className="text-left p-3 font-bold">등급</th>
                  <th className="text-center p-3 font-bold">30일</th>
                  <th className="text-center p-3 font-bold">60일</th>
                  <th className="text-center p-3 font-bold">90일</th>
                  <th className="text-center p-3 font-bold">자동점프/일</th>
                  <th className="text-center p-3 font-bold">수동점프/일</th>
                  <th className="text-center p-3 font-bold">이력서 열람</th>
                  <th className="text-left p-3 font-bold">노출 위치</th>
                  <th className="text-center p-3 font-bold">디자인 포함</th>
                  <th className="text-center p-3 font-bold">최대 지역</th>
                  <th className="text-center p-3 font-bold">최대 수정</th>
                </tr>
              </thead>
              <tbody>
                {orderedTiers.map((tier) => (
                  <tr key={tier.id} className={getTierRowClass(tier.id)}>
                    <td className="p-3 font-semibold">{tier.name}</td>
                    <td className="text-center p-3 font-medium">{formatPrice(tier.pricing[30])}</td>
                    <td className="text-center p-3 font-medium">{formatPrice(tier.pricing[60])}</td>
                    <td className="text-center p-3 font-medium">{formatPrice(tier.pricing[90])}</td>
                    <td className="text-center p-3">{formatNumber(tier.autoJumpPerDay)}</td>
                    <td className="text-center p-3">{formatNumber(tier.manualJumpPerDay)}</td>
                    <td className="text-center p-3">
                      {tier.includeResumeView ? (
                        <CheckCircle2 className="inline-block h-5 w-5 text-green-600" />
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-3 text-sm">{tier.position}</td>
                    <td className="text-center p-3">{formatNumber(tier.includeDesignCount)}</td>
                    <td className="text-center p-3">{tier.maxRegions === 0 ? "제한없음" : tier.maxRegions}</td>
                    <td className="text-center p-3">{formatNumber(tier.maxEdits)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-sm text-muted-foreground border-t pt-4">
            <p className="flex items-start gap-2">
              <span className="font-bold text-primary">※</span>
              <span>
                LINE(줄광고)은 모든 유료 광고에 필수 포함됩니다. 유료 등급 가격 = LINE + 해당 등급 추가금
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Add-on Options Table */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle className="text-2xl">추가 옵션</CardTitle>
          <CardDescription>
            광고 효과를 높이는 다양한 옵션을 추가할 수 있습니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 bg-muted/50">
                  <th className="text-left p-3 font-bold">옵션명</th>
                  <th className="text-left p-3 font-bold">설명</th>
                  <th className="text-center p-3 font-bold">30일</th>
                  <th className="text-center p-3 font-bold">60일</th>
                  <th className="text-center p-3 font-bold">90일</th>
                </tr>
              </thead>
              <tbody>
                {orderedAddOns.map((option) => (
                  <tr key={option.id} className="border-b hover:bg-muted/5 transition-colors">
                    <td className="p-3 font-semibold">{option.name}</td>
                    <td className="p-3 text-sm text-muted-foreground">{option.description}</td>
                    <td className="text-center p-3 font-medium">{formatPrice(option.pricing[30])}</td>
                    <td className="text-center p-3 font-medium">{formatPrice(option.pricing[60])}</td>
                    <td className="text-center p-3 font-medium">{formatPrice(option.pricing[90])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-sm text-muted-foreground border-t pt-4">
            <p className="flex items-start gap-2">
              <span className="font-bold text-primary">※</span>
              <span>급구 등급은 아이콘 옵션이 무료로 포함됩니다</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* CTA Section */}
      <div className="text-center">
        <Card className="max-w-2xl mx-auto bg-gradient-to-br from-primary/10 to-accent/5">
          <CardContent className="pt-8 pb-8">
            <h3 className="text-2xl font-bold mb-4">지금 시작하세요</h3>
            {session?.user?.role === "BUSINESS" ? (
              <>
                <p className="text-muted-foreground mb-6">
                  광고를 등록하고 더 많은 구직자에게 노출되세요
                </p>
                <Button size="lg" asChild className="text-lg px-8">
                  <Link href="/business/ads/new">광고 등록하기</Link>
                </Button>
              </>
            ) : session?.user?.role === "JOBSEEKER" ? (
              <>
                <p className="text-muted-foreground mb-6">
                  다양한 채용 정보를 확인해보세요
                </p>
                <Button size="lg" asChild className="text-lg px-8">
                  <Link href="/jobs">채용정보 보기</Link>
                </Button>
              </>
            ) : (
              <>
                <p className="text-muted-foreground mb-6">
                  사장님 회원가입 후 광고를 등록하고 우수한 인재를 찾으세요
                </p>
                <Button size="lg" asChild className="text-lg px-8">
                  <Link href="/register/business">사장님 회원가입</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
