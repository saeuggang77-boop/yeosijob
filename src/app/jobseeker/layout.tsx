import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";

const NAV_ITEMS = [
  { href: "/jobs", label: "채용정보", icon: "🔍" },
  { href: "/jobseeker/my-resume", label: "내 이력서", icon: "📄" },
  { href: "/jobseeker/scraps", label: "스크랩", icon: "🔖" },
  { href: "/community", label: "커뮤니티", icon: "💬" },
  { href: "/jobseeker/reviews", label: "내 후기", icon: "⭐" },
  { href: "/jobseeker/profile", label: "프로필", icon: "👤" },
];

export default async function JobseekerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session || session.user.role !== "JOBSEEKER") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Sidebar
        navItems={NAV_ITEMS}
        userName={session.user.name || session.user.email || "구직자"}
        exactMatchPaths={["/jobs"]}
        showBackLink
      />
      <main className="md:ml-60">
        <div className="mx-auto max-w-screen-xl px-4 py-6 pt-16 md:pt-6">
          {children}
        </div>
      </main>
    </div>
  );
}
