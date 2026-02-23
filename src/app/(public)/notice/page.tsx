import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const revalidate = 60;

export const metadata = {
  title: "공지사항",
  description: "여시잡 공지사항 - 중요한 소식과 업데이트를 확인하세요",
  openGraph: {
    title: "공지사항 | 여시잡",
    description: "여시잡 공지사항 - 중요한 소식과 업데이트를 확인하세요",
  },
  alternates: {
    canonical: "/notice",
  },
};

interface PageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

export default async function NoticePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const limit = 20;

  const [notices, total] = await Promise.all([
    prisma.notice.findMany({
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        title: true,
        isPinned: true,
        viewCount: true,
        createdAt: true,
      },
    }),
    prisma.notice.count(),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">공지사항</h1>
        <p className="mt-2 text-muted-foreground">중요한 소식을 확인하세요</p>
      </div>

      {/* Notice List */}
      <Card className="overflow-hidden">
        {notices.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            <p className="text-lg">등록된 공지사항이 없습니다</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">제목</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">조회수</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">작성일</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {notices.map((notice) => (
                    <tr key={notice.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/notice/${notice.id}`} className="hover:underline">
                          <span className="text-sm font-medium">
                            {notice.isPinned && <span className="mr-2">📌</span>}
                            {notice.title}
                          </span>
                          {notice.isPinned && (
                            <Badge variant="default" className="ml-2 text-xs">
                              고정
                            </Badge>
                          )}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-muted-foreground">
                        {notice.viewCount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-muted-foreground">
                        {notice.createdAt.toLocaleDateString("ko-KR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="divide-y divide-border md:hidden">
              {notices.map((notice) => (
                <Link
                  key={notice.id}
                  href={`/notice/${notice.id}`}
                  className="block p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="mb-1 text-sm font-medium">
                    {notice.isPinned && <span className="mr-2">📌</span>}
                    <span className="line-clamp-1">{notice.title}</span>
                    {notice.isPinned && (
                      <Badge variant="default" className="ml-2 text-xs">
                        고정
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {notice.createdAt.toLocaleDateString("ko-KR")} · 조회{" "}
                    {notice.viewCount.toLocaleString()}
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(
              (p) =>
                p === 1 ||
                p === totalPages ||
                (p >= page - 2 && p <= page + 2)
            )
            .map((p, idx, arr) => {
              const prev = arr[idx - 1];
              const showEllipsis = prev !== undefined && p - prev > 1;

              return (
                <span key={p}>
                  {showEllipsis && (
                    <span className="px-2 text-muted-foreground">...</span>
                  )}
                  <a
                    href={`/notice?page=${p}`}
                    className={`inline-flex h-10 w-10 items-center justify-center rounded text-sm ${
                      p === page
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    {p}
                  </a>
                </span>
              );
            })}
        </div>
      )}
    </div>
  );
}
