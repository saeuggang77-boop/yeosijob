import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { JobseekerHeader } from "@/components/jobseeker/JobseekerHeader";
import { JobseekerBottomNav } from "@/components/jobseeker/JobseekerBottomNav";

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
    <div className="flex min-h-screen flex-col">
      <JobseekerHeader userName={session.user.name || session.user.email || "구직자"} />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <JobseekerBottomNav />
    </div>
  );
}
