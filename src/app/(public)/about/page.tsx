import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata = {
  title: "여시잡 소개",
  description: "밤여시(여시) + Job = 여시잡. 밤여시 카페 기반 신뢰할 수 있는 유흥업소 구인구직 플랫폼입니다.",
  openGraph: {
    title: "여시잡 소개 | 여시잡",
    description: "밤여시(여시) + Job = 여시잡. 밤여시 카페 기반 신뢰할 수 있는 유흥업소 구인구직 플랫폼입니다.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "여시잡 - 유흥알바 No.1 구인구직" }],
  },
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-screen-md px-4 py-10">
      <h1 className="text-3xl font-bold">여시잡 소개</h1>
      <p className="mt-3 text-lg text-muted-foreground">
        여시잡은 유흥업소 전문 채용 플랫폼입니다.
      </p>
      <p className="mt-1 text-muted-foreground">
        구직자와 업소를 빠르고 안전하게 연결해 드립니다.
      </p>

      {/* 브랜드 스토리 섹션 */}
      <div className="mt-8 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
        <h2 className="text-xl font-bold">여시잡이란?</h2>
        <div className="mt-4 space-y-3 text-muted-foreground">
          <p>
            <span className="font-semibold text-primary">밤여시</span>는 국내 최대 유흥업소
            정보 커뮤니티 카페로, 오랜 시간 업계 종사자들에게 신뢰받아 온 공간입니다.
          </p>
          <p>
            <span className="font-semibold text-foreground">여시잡</span>은 바로 이{" "}
            <span className="font-semibold text-primary">밤여시(여시)</span>에{" "}
            <span className="font-semibold text-primary">Job(일자리)</span>을 더한 이름입니다.
          </p>
          <div className="my-4 flex items-center justify-center gap-3 text-lg font-bold">
            <span className="rounded-lg bg-primary/20 px-3 py-1.5 text-primary">밤여시(여시)</span>
            <span className="text-muted-foreground">+</span>
            <span className="rounded-lg bg-primary/20 px-3 py-1.5 text-primary">Job</span>
            <span className="text-muted-foreground">=</span>
            <span className="rounded-lg bg-primary px-3 py-1.5 text-primary-foreground">여시잡</span>
          </div>
          <p>
            밤여시 카페에서 쌓은 신뢰와 네트워크를 바탕으로,
            구직자와 사장님 모두가 안심하고 이용할 수 있는 구인구직 플랫폼을 만들었습니다.
          </p>
        </div>
      </div>

      <Separator className="my-8" />

      {/* 서비스 소개 */}
      <h2 className="mb-4 text-xl font-bold">주요 서비스</h2>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>채용정보</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              전국 유흥업소의 최신 채용정보를 한눈에 확인하세요.
              지역별, 업종별로 원하는 조건의 일자리를 쉽게 찾을 수 있습니다.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>이력서 등록</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              이력서를 등록하면 업소에서 직접 연락이 옵니다.
              간편한 양식으로 빠르게 이력서를 작성하고 채용 기회를 받아보세요.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>업소 후기</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              실제 근무 경험자들의 솔직한 후기를 확인하세요.
              신뢰할 수 있는 업소 정보로 안심하고 지원할 수 있습니다.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>광고 등록 (사장님)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              업소 사장님이라면 광고를 등록하고 인재를 직접 찾아보세요.
              다양한 광고 상품으로 더 많은 구직자에게 노출됩니다.
            </p>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-8" />

      {/* 왜 여시잡인가 */}
      <h2 className="mb-4 text-xl font-bold">왜 여시잡인가요?</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border p-4 text-center">
          <p className="text-3xl">🤝</p>
          <p className="mt-2 font-semibold">밤여시 기반 신뢰</p>
          <p className="mt-1 text-xs text-muted-foreground">
            오랜 커뮤니티 신뢰를 바탕으로 검증된 채용정보를 제공합니다
          </p>
        </div>
        <div className="rounded-xl border p-4 text-center">
          <p className="text-3xl">⚡</p>
          <p className="mt-2 font-semibold">빠른 매칭</p>
          <p className="mt-1 text-xs text-muted-foreground">
            지역, 업종, 조건별 검색으로 원하는 일자리를 바로 찾을 수 있습니다
          </p>
        </div>
        <div className="rounded-xl border p-4 text-center">
          <p className="text-3xl">🔒</p>
          <p className="mt-2 font-semibold">안전한 거래</p>
          <p className="mt-1 text-xs text-muted-foreground">
            사업자 인증과 후기 시스템으로 안심하고 지원할 수 있습니다
          </p>
        </div>
      </div>
    </div>
  );
}
