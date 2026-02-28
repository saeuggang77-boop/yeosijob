import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, BarChart3, Bell } from "lucide-react";
import EditProfileSection from "@/components/EditProfileSection";
import ChangePasswordSection from "@/components/ChangePasswordSection";
import DeleteAccountSection from "@/components/DeleteAccountSection";

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

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { hashedPassword: true, name: true, phone: true, businessName: true },
  });
  const hasPassword = !!user?.hashedPassword;

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
        {/* 프로필 수정 */}
        <EditProfileSection
          currentName={user?.name || ""}
          currentPhone={user?.phone || ""}
          currentBusinessName={user?.businessName || ""}
          isBusiness={true}
        />

        {/* 광고 관리 */}
        <Link href="/business/dashboard" className="block">
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BarChart3 className="size-5 text-muted-foreground" />
                  <span className="font-medium">광고 관리</span>
                </div>
                <ChevronRight className="size-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>

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
