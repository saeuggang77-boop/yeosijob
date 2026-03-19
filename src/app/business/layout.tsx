import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";

const NAV_ITEMS = [
  { href: "/jobs", label: "채용정보", icon: "🏠" },
  { href: "/business/dashboard", label: "광고 관리", icon: "📋", dividerBefore: true, sectionLabel: "구인광고" },
  { href: "/business/ads/new", label: "구인광고 등록", icon: "➕", sublabel: "유흥업소 채용공고" },
  { href: "/business/resumes", label: "인재 정보", icon: "👥" },
  { href: "/business/partner", label: "내 업체 관리", icon: "🤝", dividerBefore: true, sectionLabel: "제휴업체", sublabel: "성형·미용·렌탈·금융" },
  { href: "/business/payments", label: "결제 내역", icon: "💳", dividerBefore: true, sectionLabel: "결제" },
  { href: "/business/profile", label: "마이페이지", icon: "👤", dividerBefore: true, sectionLabel: "내 정보" },
];

export default async function BusinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session || (session.user.role !== "BUSINESS" && session.user.role !== "ADMIN")) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Sidebar
        navItems={NAV_ITEMS}
        userName={session.user.name || session.user.email || "사장님"}
        exactMatchPaths={["/jobs", "/business/dashboard", "/business/ads/new"]}
      />
      <main className="md:ml-60">
        <div className="mx-auto max-w-screen-xl px-4 py-6 pt-16 md:pt-6">
          {children}
        </div>
      </main>
    </div>
  );
}
