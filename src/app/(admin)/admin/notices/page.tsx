import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NoticeAdminActions } from "@/components/admin/NoticeAdminActions";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    page?: string;
  }>;
}

export default async function AdminNoticesPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const params = await searchParams;
  const search = params.search;
  const page = parseInt(params.page || "1", 10);
  const limit = 20;

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { content: { contains: search, mode: "insensitive" } },
    ];
  }

  const [notices, total] = await Promise.all([
    prisma.notice.findMany({
      where,
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        title: true,
        isPinned: true,
        viewCount: true,
        createdAt: true,
        author: { select: { name: true, email: true } },
      },
    }),
    prisma.notice.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  function buildUrl(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    const q = overrides.search ?? search;
    const pg = overrides.page ?? String(page);
    if (q) p.set("search", q);
    if (pg !== "1") p.set("page", pg);
    return `/admin/notices?${p.toString()}`;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">공지사항 관리</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">총 {total}건</span>
          <Link href="/admin/notices/new">
            <Button>공지 작성</Button>
          </Link>
        </div>
      </div>

      {/* Search */}
      <form className="mt-4" action="/admin/notices">
        <div className="flex gap-2">
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="제목, 내용으로 검색"
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
              <th className="pb-3 font-medium">ID</th>
              <th className="pb-3 font-medium">제목</th>
              <th className="pb-3 font-medium">고정</th>
              <th className="pb-3 font-medium">조회수</th>
              <th className="pb-3 font-medium">작성일</th>
              <th className="pb-3 font-medium">액션</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {notices.map((notice) => (
              <tr key={notice.id} className="hover:bg-muted/50">
                <td className="py-3 font-mono text-xs">
                  {notice.id.slice(0, 8)}...
                </td>
                <td className="py-3">
                  <Link href={`/notice/${notice.id}`} className="font-medium hover:text-primary">
                    {notice.title}
                  </Link>
                </td>
                <td className="py-3">
                  <Badge variant={notice.isPinned ? "default" : "secondary"}>
                    {notice.isPinned ? "고정" : "일반"}
                  </Badge>
                </td>
                <td className="py-3 text-muted-foreground">{notice.viewCount}</td>
                <td className="py-3 text-muted-foreground">
                  {new Date(notice.createdAt).toLocaleDateString("ko-KR")}
                </td>
                <td className="py-3">
                  <NoticeAdminActions noticeId={notice.id} isPinned={notice.isPinned} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {notices.length === 0 && (
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
