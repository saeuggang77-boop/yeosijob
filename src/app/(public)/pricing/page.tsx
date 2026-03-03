import { auth } from "@/lib/auth";
import { AD_PRODUCTS, AD_OPTIONS } from "@/lib/constants/products";
import { getActiveEvent } from "@/lib/event";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "광고 안내",
  description: "여시잡 광고 상품 안내 및 가격표",
  openGraph: {
    title: "광고 안내 | 여시잡",
    description: "여시잡 광고 상품 안내 및 가격표",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "여시잡 - 유흥알바 No.1 구인구직" }],
  },
  alternates: {
    canonical: "/pricing",
  },
};

export default async function PricingPage() {
  const [session, event] = await Promise.all([auth(), getActiveEvent()]);

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

      {/* Event Banner */}
      {event && (
        <div className="mb-8 rounded-xl border border-primary/30 bg-primary/5 px-6 py-5 text-center">
          <div className="flex items-center justify-center gap-2 text-lg font-bold text-primary">
            <span>🎉</span>
            <span>{event.eventName} 진행 중!</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            지금 등록하면 보너스 기간을 드려요!
            <span className="ml-2 font-medium text-foreground">
              30일 +{event.bonus30}일 · 60일 +{event.bonus60}일 · 90일 +{event.bonus90}일
            </span>
          </p>
          {event.endDate && (
            <Badge className="mt-2">
              종료까지 D-{Math.max(0, Math.ceil((event.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))}
            </Badge>
          )}
        </div>
      )}

      {/* Main Product Tiers Table */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle className="text-2xl">광고 등급별 비교</CardTitle>
          <CardDescription>
            등급에 따라 노출 위치, 점프 횟수, 이력서 열람, 쪽지, 이력서 지원 기능이 달라집니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Mobile Card Layout */}
          <div className="lg:hidden space-y-4">
            {orderedTiers.map((tier) => (
              <div key={tier.id} className={`rounded-lg p-4 ${getTierRowClass(tier.id)}`}>
                <h3 className="text-lg font-bold mb-3">{tier.name}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">30일</span>
                    <div className="text-right">
                      <span className="font-medium">{formatPrice(tier.pricing[30])}</span>
                      {event && event.bonus30 > 0 && tier.pricing[30] > 0 && (
                        <span className="block text-[10px] text-primary font-semibold">
                          30→{30 + event.bonus30}일
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">60일</span>
                    <div className="text-right">
                      <span className="font-medium">{formatPrice(tier.pricing[60])}</span>
                      {event && event.bonus60 > 0 && tier.pricing[60] > 0 && (
                        <span className="block text-[10px] text-primary font-semibold">
                          60→{60 + event.bonus60}일
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">90일</span>
                    <div className="text-right">
                      <span className="font-medium">{formatPrice(tier.pricing[90])}</span>
                      {event && event.bonus90 > 0 && tier.pricing[90] > 0 && (
                        <span className="block text-[10px] text-primary font-semibold">
                          90→{90 + event.bonus90}일
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-muted-foreground">자동점프/일</span>
                    <span>{formatNumber(tier.autoJumpPerDay)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">수동점프/일</span>
                    <span>{formatNumber(tier.manualJumpPerDay)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">이력서 지원</span>
                    <span>
                      {tier.includeResumeView ? (
                        <CheckCircle2 className="inline-block h-5 w-5 text-green-600" />
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">쪽지</span>
                    <span>
                      {["URGENT", "SPECIAL", "PREMIUM", "VIP", "BANNER"].includes(tier.id) ? (
                        <CheckCircle2 className="inline-block h-5 w-5 text-green-600" />
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">이력서 열람</span>
                    <span>
                      {tier.resumeViewLimit >= 9999 ? (
                        <span className="font-medium text-green-600">무제한</span>
                      ) : tier.resumeViewLimit > 0 ? (
                        <span className="font-medium">{tier.resumeViewLimit}건/일</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">최대 지역</span>
                    <span>{tier.maxRegions === 0 ? "제한없음" : tier.maxRegions}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <span className="text-muted-foreground">노출 위치</span>
                    <p className="mt-1">{tier.position}</p>
                  </div>
                  <div className="pt-3">
                    <Link href={`/business/ads/new?product=${tier.id}`} className="block">
                      <Button size="sm" variant={tier.id === "FREE" ? "outline" : "default"} className="w-full gap-1">
                        {tier.id === "FREE" ? "무료 등록" : "선택"} <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="border-b-2 bg-muted/50">
                  <th className="text-left p-3 font-bold">등급</th>
                  <th className="text-center p-3 font-bold">30일</th>
                  <th className="text-center p-3 font-bold">60일</th>
                  <th className="text-center p-3 font-bold">90일</th>
                  <th className="text-center p-3 font-bold">자동점프/일</th>
                  <th className="text-center p-3 font-bold">수동점프/일</th>
                  <th className="text-center p-3 font-bold">이력서 지원</th>
                  <th className="text-center p-3 font-bold">쪽지</th>
                  <th className="text-center p-3 font-bold">이력서 열람</th>
                  <th className="text-left p-3 font-bold">노출 위치</th>
                  <th className="text-center p-3 font-bold">최대 지역</th>
                  <th className="text-center p-3 font-bold"></th>
                </tr>
              </thead>
              <tbody>
                {orderedTiers.map((tier) => (
                  <tr key={tier.id} className={getTierRowClass(tier.id)}>
                    <td className="p-3 font-semibold">{tier.name}</td>
                    <td className="text-center p-3 font-medium">
                      {formatPrice(tier.pricing[30])}
                      {event && event.bonus30 > 0 && tier.pricing[30] > 0 && (
                        <span className="block text-[10px] text-primary font-semibold mt-0.5">
                          30→{30 + event.bonus30}일
                        </span>
                      )}
                    </td>
                    <td className="text-center p-3 font-medium">
                      {formatPrice(tier.pricing[60])}
                      {event && event.bonus60 > 0 && tier.pricing[60] > 0 && (
                        <span className="block text-[10px] text-primary font-semibold mt-0.5">
                          60→{60 + event.bonus60}일
                        </span>
                      )}
                    </td>
                    <td className="text-center p-3 font-medium">
                      {formatPrice(tier.pricing[90])}
                      {event && event.bonus90 > 0 && tier.pricing[90] > 0 && (
                        <span className="block text-[10px] text-primary font-semibold mt-0.5">
                          90→{90 + event.bonus90}일
                        </span>
                      )}
                    </td>
                    <td className="text-center p-3">{formatNumber(tier.autoJumpPerDay)}</td>
                    <td className="text-center p-3">{formatNumber(tier.manualJumpPerDay)}</td>
                    <td className="text-center p-3">
                      {tier.includeResumeView ? (
                        <CheckCircle2 className="inline-block h-5 w-5 text-green-600" />
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="text-center p-3">
                      {["URGENT", "SPECIAL", "PREMIUM", "VIP", "BANNER"].includes(tier.id) ? (
                        <CheckCircle2 className="inline-block h-5 w-5 text-green-600" />
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="text-center p-3">
                      {tier.resumeViewLimit >= 9999 ? (
                        <span className="font-medium text-green-600">무제한</span>
                      ) : tier.resumeViewLimit > 0 ? (
                        <span className="font-medium">{tier.resumeViewLimit}건/일</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-3 text-sm">{tier.position}</td>
                    <td className="text-center p-3">{tier.maxRegions === 0 ? "제한없음" : tier.maxRegions}</td>
                    <td className="text-center p-3">
                      <Link href={`/business/ads/new?product=${tier.id}`}>
                        <Button size="sm" variant={tier.id === "FREE" ? "outline" : "default"} className="gap-1">
                          {tier.id === "FREE" ? "무료 등록" : "선택"} <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
          {/* Mobile Card Layout */}
          <div className="lg:hidden space-y-3">
            {orderedAddOns.map((option) => (
              <div key={option.id} className="rounded-lg border p-4">
                <div className="mb-1 font-semibold">{option.name}</div>
                <p className="mb-3 text-xs text-muted-foreground">{option.description}</p>
                <div className="flex gap-2">
                  {([30, 60, 90] as const).map((days) => (
                    <div
                      key={days}
                      className="flex-1 rounded-md bg-muted/50 px-2 py-2 text-center"
                    >
                      <div className="text-[10px] text-muted-foreground">{days}일</div>
                      <div className="text-sm font-semibold text-primary">{formatPrice(option.pricing[days])}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden lg:block overflow-x-auto">
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

      {/* 업소 등급 안내 */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle className="text-2xl">업소 등급 안내</CardTitle>
          <CardDescription>
            유료 광고 이용일수가 쌓이면 업소 등급이 올라갑니다. 높은 등급은 구직자에게 신뢰감을 줍니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-[#CD7F32]/30 bg-[#CD7F32]/5 p-4 text-center">
              <div className="text-2xl">🥉</div>
              <div className="mt-1 font-bold text-[#CD7F32]">브론즈</div>
              <div className="mt-0.5 text-xs text-muted-foreground">누적 30일 이상</div>
            </div>
            <div className="rounded-lg border border-[#C0C0C0]/30 bg-[#C0C0C0]/5 p-4 text-center">
              <div className="text-2xl">🥈</div>
              <div className="mt-1 font-bold text-[#C0C0C0]">실버</div>
              <div className="mt-0.5 text-xs text-muted-foreground">누적 90일 이상</div>
            </div>
            <div className="rounded-lg border border-[#D4A853]/30 bg-[#D4A853]/5 p-4 text-center">
              <div className="text-2xl">🥇</div>
              <div className="mt-1 font-bold text-[#D4A853]">골드</div>
              <div className="mt-0.5 text-xs text-muted-foreground">누적 180일 이상</div>
            </div>
            <div className="rounded-lg border border-[#60A5FA]/30 bg-[#60A5FA]/5 p-4 text-center">
              <div className="text-2xl">💎</div>
              <div className="mt-1 font-bold text-[#60A5FA]">다이아</div>
              <div className="mt-0.5 text-xs text-muted-foreground">누적 360일 이상</div>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            ※ 등급은 채용 상세 페이지에서 업소명 옆에 표시되며, 구직자가 업소의 신뢰도를 판단하는 기준이 됩니다.
          </p>
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
