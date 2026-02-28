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
          <a
            href="https://pf.kakao.com/_zEqYG/chat"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-[#FEE500] px-3 py-1.5 text-xs font-semibold text-[#3C1E1E] transition-opacity hover:opacity-80"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#3C1E1E" aria-hidden="true">
              <path d="M12 3C6.48 3 2 6.58 2 10.9c0 2.78 1.86 5.22 4.66 6.6l-.86 3.18c-.05.2.17.36.34.25l3.77-2.5c.67.1 1.36.16 2.09.16 5.52 0 10-3.58 10-7.99S17.52 3 12 3z"/>
            </svg>
            고객센터
          </a>
          <p className="mt-3">&copy; {new Date().getFullYear()} 여시잡. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
