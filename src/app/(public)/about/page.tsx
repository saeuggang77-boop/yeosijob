import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "여시잡 소개",
  description: "유흥업소 채용 플랫폼 여시잡를 소개합니다.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-screen-md px-4 py-10">
      <h1 className="text-3xl font-bold">여시잡 소개</h1>
      <p className="mt-3 text-lg text-muted-foreground">
        여시잡는 유흥업소 전문 채용 플랫폼입니다.
      </p>
      <p className="mt-1 text-muted-foreground">
        구직자와 업소를 빠르고 안전하게 연결해 드립니다.
      </p>

      <div className="mt-8 space-y-4">
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
    </div>
  );
}
