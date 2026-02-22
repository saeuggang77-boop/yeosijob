import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { JobseekerSidebar } from "@/components/jobseeker/JobseekerSidebar";

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
      <JobseekerSidebar userName={session.user.name || session.user.email || "구직자"} />
      <main className="md:ml-60">
        <div className="mx-auto max-w-screen-xl px-4 py-6 pt-16 md:pt-6">
          {children}
        </div>
      </main>
    </div>
  );
}
