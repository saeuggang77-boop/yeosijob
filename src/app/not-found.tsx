import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="text-gradient-gold text-8xl font-bold">404</p>
      <h1 className="mt-4 text-2xl font-bold">페이지를 찾을 수 없습니다</h1>
      <p className="mt-2 text-muted-foreground">
        요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/">
          <Button>홈으로 이동</Button>
        </Link>
        <Link href="/jobs">
          <Button variant="outline">채용정보 보기</Button>
        </Link>
      </div>
    </div>
  );
}
