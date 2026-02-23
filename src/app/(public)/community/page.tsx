import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const revalidate = 60;

export const metadata = {
  title: "커뮤니티",
  description: "유흥업계 종사자들의 커뮤니티 게시판",
  openGraph: {
    title: "커뮤니티 | 여시잡",
    description: "유흥업계 종사자들의 커뮤니티 게시판",
  },
};

interface PageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

export default async function CommunityPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const limit = 20;

  const session = await auth();

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: { isHidden: false },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        title: true,
        createdAt: true,
        viewCount: true,
        author: {
          select: { name: true },
        },
        _count: {
          select: { comments: true },
        },
      },
    }),
    prisma.post.count({ where: { isHidden: false } }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">자유수다</h1>
        <p className="mt-2 text-muted-foreground">자유롭게 이야기를 나눠보세요</p>
      </div>

      {/* Write Button */}
      {session?.user?.role === "JOBSEEKER" && (
        <div className="mb-4 flex justify-end">
          <Link href="/community/new">
            <Button>글쓰기</Button>
          </Link>
        </div>
      )}

      {/* Post List */}
      <Card className="overflow-hidden">
        {posts.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            <p className="text-lg">등록된 게시글이 없습니다</p>
            <p className="mt-1 text-sm">첫 게시글을 작성해보세요!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">번호</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">제목</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">작성자</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">조회수</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">댓글</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">작성일</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {posts.map((post, idx) => (
                  <tr key={post.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {total - (page - 1) * limit - idx}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/community/${post.id}`} className="hover:underline">
                        <span className="text-sm font-medium">{post.title}</span>
                        {post._count.comments > 0 && (
                          <span className="ml-1.5 text-xs text-primary">
                            [{post._count.comments}]
                          </span>
                        )}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {post.author.name}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-muted-foreground">
                      {post.viewCount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-muted-foreground">
                      {post._count.comments}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-muted-foreground">
                      {post.createdAt.toLocaleDateString("ko-KR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                    href={`/community?page=${p}`}
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
