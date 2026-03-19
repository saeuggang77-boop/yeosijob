import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function BusinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session || (session.user.role !== "BUSINESS" && session.user.role !== "ADMIN")) {
    redirect("/login");
  }

  // Ad/Partner 존재 여부로 사이드바 메뉴 필터링
  const [adCount, partnerCount] = await Promise.all([
    prisma.ad.count({ where: { userId: session.user.id } }),
    prisma.partner.count({ where: { userId: session.user.id } }),
  ]);

  const showAdMenus = adCount > 0 || partnerCount === 0; // Ad 있거나, 둘 다 없으면 (신규)
  const showPartnerMenus = partnerCount > 0 || adCount === 0; // Partner 있거나, 둘 다 없으면 (신규)

  const navItems = [
    { href: "/jobs", label: "채용정보", icon: "🏠" },
    ...(showAdMenus ? [
      { href: "/business/dashboard", label: "광고 관리", icon: "📋", dividerBefore: true, sectionLabel: "구인광고" },
      { href: "/business/ads/new", label: "구인광고 등록", icon: "➕", sublabel: "유흥업소 채용공고" },
      { href: "/business/resumes", label: "인재 정보", icon: "👥" },
    ] : []),
    ...(showPartnerMenus ? [
      { href: "/business/partner", label: "내 업체 관리", icon: "🤝", dividerBefore: true, sectionLabel: "제휴업체", sublabel: "성형·미용·렌탈·금융" },
    ] : []),
    { href: "/business/payments", label: "결제 내역", icon: "💳", dividerBefore: true, sectionLabel: "결제" },
    { href: "/business/profile", label: "마이페이지", icon: "👤", dividerBefore: true, sectionLabel: "내 정보" },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <Sidebar
        navItems={navItems}
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
