import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { PushSubscriptionManager } from "@/components/push/PushSubscriptionManager";

const NAV_ITEMS = [
  { href: "/admin", label: "대시보드", icon: "📊" },
  { href: "/admin/ads", label: "광고 관리", icon: "📢" },
  { href: "/admin/payments", label: "결제 관리", icon: "💳" },
  { href: "/admin/users", label: "회원 관리", icon: "👥" },
  { href: "/admin/resumes", label: "이력서", icon: "📄" },
  { href: "/admin/reviews", label: "후기 관리", icon: "⭐" },
  { href: "/admin/posts", label: "게시판 관리", icon: "💬" },
  { href: "/admin/trash", label: "휴지통", icon: "🗑️" },
  { href: "/admin/reports", label: "신고 관리", icon: "🚨" },
  { href: "/admin/banned", label: "제재 관리", icon: "🚫" },
  { href: "/admin/notices", label: "공지사항 관리", icon: "📣" },
  { href: "/admin/events", label: "이벤트 관리", icon: "🎉" },
  { href: "/admin/auto-content", label: "자동 콘텐츠", icon: "🤖" },
  { href: "/admin/verification", label: "업소 인증", icon: "✅" },
  { href: "/admin/cafe-sync", label: "카페 연동", icon: "🔗" },
  { href: "/admin/spam", label: "스팸 필터", icon: "🛡️" },
  { href: "/admin/settings", label: "설정", icon: "⚙️" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Sidebar
        navItems={NAV_ITEMS}
        userName={session.user.name || session.user.email || "관리자"}
        logoText="여시잡 관리자"
        logoHref="/admin"
        exactMatchPaths={["/admin"]}
        showBackLink
        backLinkLabel="← 사이트로 돌아가기"
        showLogout={false}
        userNameSuffix=""
      />
      <main className="md:ml-60">
        <div className="mx-auto max-w-screen-xl px-4 py-6 pt-16 md:pt-6">
          {children}
        </div>
      </main>
      <PushSubscriptionManager />
    </div>
  );
}
