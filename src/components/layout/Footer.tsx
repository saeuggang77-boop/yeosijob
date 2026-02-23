import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto max-w-screen-xl px-4 py-8">
        {/* 상단: 링크 영역 */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <Link href="/jobs" className="hover:text-primary">채용정보</Link>
          <Link href="/business/ads/new" className="hover:text-primary">광고등록</Link>
          <Link href="/about" className="hover:text-primary">서비스 소개</Link>
          <Link href="/terms" className="hover:text-primary">이용약관</Link>
          <Link href="/privacy" className="hover:text-primary font-medium">개인정보처리방침</Link>
        </div>

        {/* 하단: 사업자 정보 */}
        <div data-nosnippet="" className="mt-5 border-t border-border pt-5 text-xs leading-relaxed text-muted-foreground/70">
          <p className="font-semibold text-primary">여시잡</p>
          <p className="mt-2">
            상호: 씨이오 | 대표: 박상만 | 사업자등록번호: 408-70-43230
          </p>
          <p>
            통신판매신고번호: 제2023-서울동작-1252 | 주소: 서울특별시 동작구 장승배기로4길 9
          </p>
          <p>
            고객센터: 1588-7928 | 이메일: samsungcu&#64;naver.com
          </p>
          <p className="mt-3">&copy; {new Date().getFullYear()} 여시잡. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
