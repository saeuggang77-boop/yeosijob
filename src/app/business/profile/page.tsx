import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, BarChart3, Bell, PenSquare, Handshake } from "lucide-react";
import EditProfileSection from "@/components/EditProfileSection";
import ChangePasswordSection from "@/components/ChangePasswordSection";
import DeleteAccountSection from "@/components/DeleteAccountSection";
import { VerificationStatus } from "@/components/business/VerificationStatus";
import { FontSizeToggle } from "@/components/FontSizeToggle";

async function LogoutButton() {
  return (
    <form
      action={async () => {
        "use server";
        const { signOut } = await import("@/lib/auth");
        await signOut();
      }}
    >
      <Button type="submit" variant="outline" className="w-full">
        로그아웃
      </Button>
    </form>
  );
}

export default async function BusinessProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "BUSINESS") {
    redirect("/");
  }

  const [user, adCount, partnerCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { hashedPassword: true, name: true, phone: true, businessName: true, isVerifiedBiz: true },
    }),
    prisma.ad.count({ where: { userId: session.user.id } }),
    prisma.partner.count({ where: { userId: session.user.id } }),
  ]);
  const hasPassword = !!user?.hashedPassword;
  const isVerified = !!user?.isVerifiedBiz;
  // 현재 사용 중이 아닌 서비스 진입점 표시
  const showAdEntry = adCount === 0 && partnerCount > 0;
  const showPartnerEntry = partnerCount === 0 && adCount > 0;

  return (
    <div className="mx-auto max-w-screen-lg px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">마이페이지</h1>
        <div className="mt-2 text-sm text-muted-foreground">
          <p>{session.user.email}</p>
          {session.user.name && <p>{session.user.name}</p>}
          {session.user.businessName && (
            <p className="font-medium text-foreground">{session.user.businessName}</p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* 사업자 인증 상태 */}
        <VerificationStatus isVerified={isVerified} />

        {/* 광고 바로가기 (핵심 기능 최상단) */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/business/dashboard" className="block">
            <Card className="border-primary/30 bg-primary/5 transition-shadow hover:shadow-md">
              <CardContent className="flex flex-col items-center gap-1.5 p-4">
                <BarChart3 className="size-6 text-primary" />
                <span className="text-sm font-semibold text-primary">광고 관리</span>
                <span className="text-[11px] text-muted-foreground">내 광고 현황</span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/business/ads/new" className="block">
            <Card className="border-primary/30 bg-primary/5 transition-shadow hover:shadow-md">
              <CardContent className="flex flex-col items-center gap-1.5 p-4">
                <PenSquare className="size-6 text-primary" />
                <span className="text-sm font-semibold text-primary">광고 등록</span>
                <span className="text-[11px] text-muted-foreground">새 광고 작성</span>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* 다른 서비스 시작하기 */}
        {showAdEntry && (
          <Link href="/business/ads/new" className="block">
            <Card className="border-dashed border-primary/30 transition-shadow hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <PenSquare className="size-5 text-primary" />
                    <div>
                      <span className="font-medium">구인광고도 등록하기</span>
                      <span className="block text-[11px] text-muted-foreground">유흥업소 채용공고를 등록할 수 있습니다</span>
                    </div>
                  </div>
                  <ChevronRight className="size-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </Link>
        )}
        {showPartnerEntry && (
          <Link href="/business/partner" className="block">
            <Card className="border-dashed border-primary/30 transition-shadow hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Handshake className="size-5 text-primary" />
                    <div>
                      <span className="font-medium">제휴업체도 등록하기</span>
                      <span className="block text-[11px] text-muted-foreground">성형·미용·렌탈·금융 업체를 등록할 수 있습니다</span>
                    </div>
                  </div>
                  <ChevronRight className="size-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        {/* 알림 설정 */}
        <Link href="/settings/notifications" className="block">
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="size-5 text-muted-foreground" />
                  <span className="font-medium">알림 설정</span>
                </div>
                <ChevronRight className="size-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* 프로필 수정 */}
        <EditProfileSection
          currentName={user?.name || ""}
          currentPhone={user?.phone || ""}
          currentBusinessName={user?.businessName || ""}
          isBusiness={true}
        />

        {/* 글자 크기 설정 */}
        <FontSizeToggle />

        {/* 비밀번호 변경 */}
        {hasPassword && <ChangePasswordSection />}
      </div>

      {/* 회원 탈퇴 */}
      <div className="mt-8">
        <DeleteAccountSection hasPassword={hasPassword} />
      </div>

      {/* 로그아웃 버튼 */}
      <div className="mt-8">
        <LogoutButton />
      </div>

      {/* 하단 여백 (모바일 네비) */}
      <div className="h-20 md:hidden" />
    </div>
  );
}
