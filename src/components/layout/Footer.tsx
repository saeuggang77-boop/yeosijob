import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-screen-xl px-4 py-8">
        <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
          <div className="text-center md:text-left">
            <p className="text-lg font-bold">여시알바</p>
            <p className="mt-1 text-sm text-muted-foreground">
              밤여시 카페 기반 구인구직 플랫폼
            </p>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/about" className="py-2 hover:underline">
              서비스 소개
            </Link>
            <Link href="/terms" className="py-2 hover:underline">
              이용약관
            </Link>
            <Link href="/privacy" className="py-2 hover:underline">
              개인정보처리방침
            </Link>
          </div>
        </div>
        <div className="mt-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} 여시알바. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
