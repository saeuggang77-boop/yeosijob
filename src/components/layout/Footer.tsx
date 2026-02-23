import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto max-w-screen-xl px-4 py-10">
        <div className="grid gap-8 md:grid-cols-3">
          {/* 회사 정보 */}
          <div>
            <p className="text-lg font-bold text-primary">여시알바</p>
            <p className="mt-2 text-sm text-muted-foreground">유흥업계 No.1 구인구직 플랫폼</p>
            <div className="mt-4 space-y-1 text-xs text-muted-foreground">
              <p>상호: 여시알바</p>
              <p>대표: -</p>
              <p>사업자등록번호: 준비중</p>
              <p>고객센터: 카카오톡 @yeosialba</p>
            </div>
          </div>

          {/* 서비스 */}
          <div>
            <p className="text-sm font-bold">서비스</p>
            <div className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-primary">채용정보</Link>
              <Link href="/business/ads/new" className="hover:text-primary">광고등록</Link>
              <Link href="/about" className="hover:text-primary">서비스 소개</Link>
            </div>
          </div>

          {/* 약관 */}
          <div>
            <p className="text-sm font-bold">약관 및 정책</p>
            <div className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/terms" className="hover:text-primary">이용약관</Link>
              <Link href="/privacy" className="hover:text-primary font-medium">개인정보처리방침</Link>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} 여시알바. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
