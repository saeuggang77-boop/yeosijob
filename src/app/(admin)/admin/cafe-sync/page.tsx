import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CAFE_URL } from "@/lib/cafe/config";
import { AD_PRODUCTS } from "@/lib/constants/products";
import { BUSINESS_TYPE_LIST } from "@/lib/constants/business-types";
import { REGION_LIST } from "@/lib/constants/regions";

export default async function CafeSyncPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  // ACTIVE 광고 목록 조회
  const activeAds = await prisma.ad.findMany({
    where: { status: "ACTIVE" },
    orderBy: { startDate: "desc" },
    select: {
      id: true,
      title: true,
      businessName: true,
      businessType: true,
      regions: true,
      productId: true,
      startDate: true,
      endDate: true,
      contactPhone: true,
      salaryText: true,
      description: true,
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">밤여시 카페 연동</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          네이버 카페에 광고를 수동으로 등록할 수 있습니다
        </p>
      </div>

      {/* 안내 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">카페 연동 안내</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-medium">📌 현재 수동 등록 방식</p>
            <p className="text-muted-foreground">
              카페 연동은 현재 관리자가 직접 카페에 글을 작성하는 방식으로 진행됩니다.
            </p>
          </div>
          <div>
            <p className="font-medium">🔗 밤여시 카페</p>
            <a
              href={CAFE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {CAFE_URL}
            </a>
          </div>
          <div>
            <p className="font-medium">⚙️ 향후 자동화 예정</p>
            <p className="text-muted-foreground">
              네이버 카페 API 연동 또는 자동화 스크립트를 통해 자동 등록 기능을 추가할 예정입니다.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 활성 광고 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            활성 광고 목록{" "}
            <span className="text-sm font-normal text-muted-foreground">
              ({activeAds.length}건)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeAds.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              활성 광고가 없습니다
            </p>
          ) : (
            <div className="space-y-3">
              {activeAds.map((ad) => {
                const product = AD_PRODUCTS[ad.productId];
                const businessTypeLabel =
                  BUSINESS_TYPE_LIST.find((b) => b.value === ad.businessType)
                    ?.label || ad.businessType;
                const regionLabels = ad.regions
                  .map(
                    (r) =>
                      REGION_LIST.find((reg) => reg.value === r)?.label || r
                  )
                  .join(", ");

                return (
                  <div
                    key={ad.id}
                    className="rounded-lg border bg-muted/30 p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{ad.title}</h3>
                          <Badge variant="outline" className="text-xs">
                            {product.name}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {ad.businessName} · {businessTypeLabel}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          📍 {regionLabels} · 💰 {ad.salaryText}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          기간:{" "}
                          {ad.startDate
                            ? new Date(ad.startDate).toLocaleDateString(
                                "ko-KR"
                              )
                            : "-"}{" "}
                          ~{" "}
                          {ad.endDate
                            ? new Date(ad.endDate).toLocaleDateString("ko-KR")
                            : "-"}
                        </p>
                      </div>
                    </div>

                    {/* 카페 등록용 텍스트 */}
                    <details className="mt-3">
                      <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                        카페 등록용 텍스트 보기
                      </summary>
                      <div className="mt-2 rounded border bg-background p-3 text-xs font-mono">
                        <pre className="whitespace-pre-wrap">
                          {`[${product.name}] ${ad.title}

업소명: ${ad.businessName}
업종: ${businessTypeLabel}
지역: ${regionLabels}
급여: ${ad.salaryText}
연락처: ${ad.contactPhone}

${ad.description}

기간: ${ad.startDate ? new Date(ad.startDate).toLocaleDateString("ko-KR") : "-"} ~ ${ad.endDate ? new Date(ad.endDate).toLocaleDateString("ko-KR") : "-"}`}
                        </pre>
                      </div>
                    </details>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 카페 글쓰기 가이드 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">카페 글쓰기 가이드</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-medium">1. 카페 접속</p>
            <p className="text-muted-foreground">
              밤여시 네이버 카페에 접속하여 로그인합니다.
            </p>
          </div>
          <div>
            <p className="font-medium">2. 게시판 선택</p>
            <p className="text-muted-foreground">
              적절한 게시판(예: 채용정보, 구인구직)을 선택합니다.
            </p>
          </div>
          <div>
            <p className="font-medium">3. 글 작성</p>
            <p className="text-muted-foreground">
              위 광고 목록에서 "카페 등록용 텍스트 보기"를 클릭하여 복사 후
              카페에 붙여넣기합니다.
            </p>
          </div>
          <div>
            <p className="font-medium">4. 제목 형식</p>
            <p className="text-muted-foreground">
              제목은 "[등급] 업소명 - 간단한 설명" 형식을 권장합니다.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              예: [프리미엄] 강남 OO룸 - 일급 30만원 / 급여 당일지급
            </p>
          </div>
          <div>
            <p className="font-medium">5. 이미지 첨부 (선택)</p>
            <p className="text-muted-foreground">
              광고 이미지가 있는 경우 함께 첨부하면 더 효과적입니다.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
