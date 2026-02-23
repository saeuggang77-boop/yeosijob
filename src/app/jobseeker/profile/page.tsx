import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, FileText, Heart, MessageSquare } from "lucide-react";
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

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "JOBSEEKER") {
    redirect("/");
  }

  const userId = session.user.id;

  // Query counts
  const [scrapCount, reviewCount, resume, user] = await Promise.all([
    prisma.scrap.count({ where: { userId } }),
    prisma.review.count({ where: { userId } }),
    prisma.resume.findUnique({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { hashedPassword: true, name: true, phone: true } }),
  ]);

  const resumeStatus = resume ? "등록됨" : "미등록";
  const hasPassword = !!user?.hashedPassword;

  return (
    <div className="mx-auto max-w-screen-lg px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">마이페이지</h1>
        <div className="mt-2 text-sm text-muted-foreground">
          <p>{session.user.email}</p>
          {session.user.name && <p>{session.user.name}</p>}
        </div>
      </div>

      <div className="space-y-4">
        {/* 프로필 수정 */}
        <EditProfileSection
          currentName={user?.name || ""}
          currentPhone={user?.phone || ""}
          isBusiness={false}
        />

        {/* 내 이력서 */}
        <Link href="/jobseeker/my-resume" className="block">
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="size-5 text-muted-foreground" />
                  <span className="font-medium">내 이력서</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={resume ? "default" : "secondary"}>
                    {resumeStatus}
                  </Badge>
                  <ChevronRight className="size-5 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* 스크랩한 공고 */}
        <Link href="/jobseeker/scraps" className="block">
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Heart className="size-5 text-muted-foreground" />
                  <span className="font-medium">스크랩한 공고</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{scrapCount}건</Badge>
                  <ChevronRight className="size-5 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* 내가 쓴 후기 */}
        <Link href="/jobseeker/reviews" className="block">
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageSquare className="size-5 text-muted-foreground" />
                  <span className="font-medium">내가 쓴 후기</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{reviewCount}건</Badge>
                  <ChevronRight className="size-5 text-muted-foreground" />
                </div>
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
