import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";

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
      <header className="border-b bg-background">
        <div className="mx-auto max-w-screen-xl px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/admin" className="text-lg font-bold">
              여시알바 관리자
            </Link>
            <div className="text-sm text-muted-foreground">
              {session.user.name || session.user.email}
            </div>
          </div>
          <nav className="mt-2 flex gap-4 overflow-x-auto text-sm">
            <Link
              href="/admin"
              className="shrink-0 py-1 text-muted-foreground hover:text-foreground"
            >
              대시보드
            </Link>
            <Link
              href="/admin/ads"
              className="shrink-0 py-1 text-muted-foreground hover:text-foreground"
            >
              광고 관리
            </Link>
            <Link
              href="/admin/payments"
              className="shrink-0 py-1 text-muted-foreground hover:text-foreground"
            >
              결제 관리
            </Link>
            <Link
              href="/admin/verification"
              className="shrink-0 py-1 text-muted-foreground hover:text-foreground"
            >
              업소인증
            </Link>
            <Link
              href="/admin/cafe-sync"
              className="shrink-0 py-1 text-muted-foreground hover:text-foreground"
            >
              카페 연동
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-screen-xl px-4 py-6">{children}</main>
    </div>
  );
}
