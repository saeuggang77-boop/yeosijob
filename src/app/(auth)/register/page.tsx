import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "회원가입",
  description: "여시잡 회원가입 - 구직자 또는 업소 사장님으로 가입하세요.",
};

export default function RegisterPage() {
  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">회원가입</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          가입 유형을 선택해주세요
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <Link
          href="/register/jobseeker"
          className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xl">
            👤
          </div>
          <div className="flex-1">
            <div className="text-lg font-semibold">구직자</div>
            <div className="text-sm text-muted-foreground">
              일자리를 찾고 있어요
            </div>
          </div>
          <div className="text-xl text-muted-foreground">›</div>
        </Link>

        <Link
          href="/register/business"
          className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xl">
            🏢
          </div>
          <div className="flex-1">
            <div className="text-lg font-semibold">업소 사장님</div>
            <div className="text-sm text-muted-foreground">
              광고 등록 · 인재 검색 · 제휴 입점
            </div>
          </div>
          <div className="text-xl text-muted-foreground">›</div>
        </Link>
      </div>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="text-primary hover:underline">
          로그인
        </Link>
      </div>
    </div>
  );
}
