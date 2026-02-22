import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { BusinessSidebar } from "@/components/business/BusinessSidebar";

export default async function BusinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session || session.user.role !== "BUSINESS") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <BusinessSidebar userName={session.user.name || session.user.email || "사장님"} />
      <main className="md:ml-60">
        <div className="mx-auto max-w-screen-xl px-4 py-6 pt-16 md:pt-6">
          {children}
        </div>
      </main>
    </div>
  );
}
