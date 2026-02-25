import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GrantCreditsButton } from "@/components/admin/GrantCreditsButton";

interface PageProps {
  searchParams: Promise<{
    role?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const params = await searchParams;
  const role = params.role as "BUSINESS" | "JOBSEEKER" | "ADMIN" | undefined;
  const search = params.search;
  const page = parseInt(params.page || "1", 10);
  const limit = 20;

  const where: Record<string, unknown> = { isGhost: false };
  if (role) where.role = role;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        businessName: true,
        isActive: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  const roleLabels: Record<string, string> = {
    BUSINESS: "사장님",
    JOBSEEKER: "구직자",
    ADMIN: "관리자",
  };

  function buildUrl(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    const r = overrides.role ?? role;
    const q = overrides.search ?? search;
    const pg = overrides.page ?? String(page);
    if (r) p.set("role", r);
    if (q) p.set("search", q);
    if (pg !== "1") p.set("page", pg);
    return `/admin/users?${p.toString()}`;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">회원 관리</h1>
        <span className="text-sm text-muted-foreground">총 {total}명</span>
      </div>

      {/* Role filter */}
      <div className="mt-4 flex gap-2">
        <Link href="/admin/users">
          <Button variant={!role ? "default" : "outline"} size="sm">전체</Button>
        </Link>
        {(["BUSINESS", "JOBSEEKER", "ADMIN"] as const).map((r) => (
          <Link key={r} href={buildUrl({ role: r, page: "1" })}>
            <Button variant={role === r ? "default" : "outline"} size="sm">
              {roleLabels[r]}
            </Button>
          </Link>
        ))}
      </div>

      {/* Search */}
      <form className="mt-4" action="/admin/users">
        {role && <input type="hidden" name="role" value={role} />}
        <div className="flex gap-2">
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="이름, 이메일로 검색"
            className="h-10 flex-1 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button type="submit" className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
            검색
          </button>
        </div>
      </form>

      {/* Table */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-3 font-medium">이름</th>
              <th className="pb-3 font-medium">이메일</th>
              <th className="pb-3 font-medium">역할</th>
              <th className="pb-3 font-medium">업소명</th>
              <th className="pb-3 font-medium">가입일</th>
              <th className="pb-3 font-medium">무료광고권</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-muted/50">
                <td className="py-3 font-medium">{user.name || "-"}</td>
                <td className="py-3 text-muted-foreground">{user.email}</td>
                <td className="py-3">
                  <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                    {roleLabels[user.role]}
                  </Badge>
                </td>
                <td className="py-3 text-muted-foreground">{user.businessName || "-"}</td>
                <td className="py-3 text-muted-foreground">
                  {user.createdAt.toLocaleDateString("ko-KR")}
                </td>
                <td className="py-3">
                  {user.role === "BUSINESS" ? (
                    <GrantCreditsButton userId={user.id} />
                  ) : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <p className="py-12 text-center text-muted-foreground">검색 결과가 없습니다</p>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-1">
          {page > 1 && (
            <a href={buildUrl({ page: String(page - 1) })} className="inline-flex h-10 w-10 items-center justify-center rounded text-sm hover:bg-muted">←</a>
          )}
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
            const p = Math.max(1, Math.min(page - 4, totalPages - 9)) + i;
            if (p > totalPages) return null;
            return (
              <a
                key={p}
                href={buildUrl({ page: String(p) })}
                className={`inline-flex h-10 w-10 items-center justify-center rounded text-sm ${
                  p === page ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                {p}
              </a>
            );
          })}
          {page < totalPages && (
            <a href={buildUrl({ page: String(page + 1) })} className="inline-flex h-10 w-10 items-center justify-center rounded text-sm hover:bg-muted">→</a>
          )}
        </div>
      )}
    </div>
  );
}
