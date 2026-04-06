import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "실시간 알림 · 텔레그램 채널 | 여시잡",
  description: "여시잡 공식 텔레그램 채널에서 신규 이력서를 실시간으로 받아보세요.",
  robots: { index: false, follow: false },
};

const INVITE_URL = process.env.NEXT_PUBLIC_TELEGRAM_INVITE_URL || "https://t.me/yeosijob";

export default function BusinessTelegramPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* 헤더 */}
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/20 text-4xl">
          📢
        </div>
        <h1 className="mt-4 text-2xl font-bold sm:text-3xl">
          실시간 이력서 알림
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          여시잡 공식 텔레그램 채널에 참여하고
          <br className="sm:hidden" />
          신규 이력서를 가장 먼저 확인하세요
        </p>
      </div>

      {/* 메인 CTA 카드 */}
      <Card className="mt-6 border-cyan-500/40 bg-gradient-to-br from-cyan-500/5 via-sky-500/5 to-blue-500/5">
        <CardContent className="py-6">
          <div className="text-center">
            <p className="text-lg font-semibold">
              @yeosijob 공식 채널
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              무료 · 광고 없음 · 알림 즉시 수신
            </p>

            <a
              href={INVITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-block w-full sm:w-auto"
            >
              <Button
                size="lg"
                className="w-full bg-cyan-500 text-white hover:bg-cyan-600 sm:w-auto sm:px-8"
              >
                텔레그램 채널 바로가기 →
              </Button>
            </a>

            <p className="mt-3 text-xs text-muted-foreground">
              텔레그램이 설치되어 있어야 합니다.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 혜택 섹션 */}
      <div className="mt-8">
        <h2 className="text-lg font-bold">이런 점이 좋습니다</h2>
        <div className="mt-4 space-y-3">
          <BenefitCard
            icon="⚡"
            title="즉시 알림"
            description="새 이력서가 등록되는 순간 바로 텔레그램 알림이 옵니다. 사이트에 계속 접속할 필요가 없습니다."
          />
          <BenefitCard
            icon="🎯"
            title="경쟁 우위"
            description="다른 업소보다 한발 먼저 연락해서 우수 인재를 놓치지 마세요."
          />
          <BenefitCard
            icon="🔒"
            title="익명 보호"
            description="채널에는 지역·업종·연령대·경력·희망 급여 형태만 표시됩니다. 이름·사진·연락처 등 개인정보는 여시잡 사이트 내에서만 확인 가능합니다."
          />
          <BenefitCard
            icon="💬"
            title="소음 없음"
            description="오직 신규 이력서 알림만 발송됩니다. 광고·잡담 없이 깔끔합니다."
          />
        </div>
      </div>

      {/* 이용 방법 */}
      <div className="mt-8">
        <h2 className="text-lg font-bold">이용 방법</h2>
        <Card className="mt-3">
          <CardContent className="py-4">
            <ol className="space-y-3 text-sm">
              <Step number={1}>
                위 <b>텔레그램 채널 바로가기</b> 버튼을 누릅니다.
              </Step>
              <Step number={2}>
                텔레그램 앱에서 <b>참여(JOIN)</b> 버튼을 눌러 채널을 구독합니다.
              </Step>
              <Step number={3}>
                이제 새 이력서가 등록될 때마다 자동으로 알림을 받습니다.
              </Step>
              <Step number={4}>
                관심 있는 이력서를 발견하면 채널의 링크를 눌러 여시잡에서 상세 정보를 확인하세요.
              </Step>
            </ol>
          </CardContent>
        </Card>
      </div>

      {/* 이력서 상세 열람 안내 */}
      <Card className="mt-6 border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20">
        <CardContent className="py-4">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
            💡 알아두세요
          </p>
          <p className="mt-1 text-sm text-amber-800 dark:text-amber-300/90">
            이력서 상세 정보(연락처·사진·상세 경력)는 여시잡 사이트에서 <b>유료 광고 등록 회원</b>만 열람할 수 있습니다.
            텔레그램 알림은 누구나 받을 수 있지만, 실제 연락은 광고 등록 후 가능합니다.
          </p>
          <Link href="/business/ads/new" className="mt-3 inline-block">
            <Button size="sm" variant="outline">
              광고 등록하기
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* 하단 링크 */}
      <div className="mt-8 text-center">
        <Link
          href="/business/resumes"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← 인재 정보로 돌아가기
        </Link>
      </div>
    </div>
  );
}

function BenefitCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-xl">
            {icon}
          </div>
          <div>
            <p className="font-semibold">{title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Step({
  number,
  children,
}: {
  number: number;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500 text-xs font-bold text-white">
        {number}
      </span>
      <span className="pt-0.5 text-muted-foreground">{children}</span>
    </li>
  );
}
