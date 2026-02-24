import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";

const NAV_ITEMS = [
  { href: "/jobs", label: "채용정보", icon: "🏠" },
  { href: "/business/dashboard", label: "광고 관리", icon: "📋" },
  { href: "/business/ads/new", label: "광고 등록", icon: "➕" },
  { href: "/business/resumes", label: "인재 정보", icon: "👥" },
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
