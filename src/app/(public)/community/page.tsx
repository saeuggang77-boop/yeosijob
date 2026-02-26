import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDateSmart } from "@/lib/utils/format";

export const revalidate = 60;

export const metadata = {
  title: "커뮤니티",
  description: "유흥업계 종사자들의 커뮤니티 게시판",
  openGraph: {
    title: "커뮤니티 | 여시잡",
    description: "유흥업계 종사자들의 커뮤니티 게시판",
  },
  alternates: {
    canonical: "/community",
  },
};

const CATEGORIES = [
  { key: "", label: "전체" },
  { key: "CHAT", label: "수다방" },
  { key: "BEAUTY", label: "뷰티톡" },
  { key: "QNA", label: "질문방" },
  { key: "WORK", label: "업소톡" },
];

interface PageProps {
  searchParams: Promise<{
    page?: string;
    category?: string;
  }>;
}

export default async function CommunityPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const category = params.category || "";
  const limit = 20;

  const session = await auth();

  const where: Record<string, unknown> = { isHidden: false };
  if (category && ["CHAT", "BEAUTY", "QNA", "WORK"].includes(category)) {
    where.category = category;
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        title: true,
        category: true,
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
    prisma.post.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">커뮤니티</h1>
          <p className="mt-2 text-muted-foreground">자유롭게 이야기를 나눠보세요</p>
        </div>
        {session?.user?.role === "JOBSEEKER" && (
          <Link href="/community/new">
            <Button>글쓰기</Button>
          </Link>
        )}
      </div>

      {/* Category Tabs */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((tab) => (
          <Link key={tab.key} href={`/community${tab.key ? `?category=${tab.key}` : ""}`}>
            <Button
              variant={category === tab.key ? "default" : "outline"}
              size="sm"
            >
              {tab.label}
            </Button>
          </Link>
        ))}
      </div>

      {/* Post List */}
      <Card className="overflow-hidden">
        {posts.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            <p className="text-lg">등록된 게시글이 없습니다</p>
            <p className="mt-1 text-sm">첫 게시글을 작성해보세요!</p>
          </div>
        ) : (
          <>
            {/* Mobile Card Layout */}
            <div className="md:hidden divide-y divide-border">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/community/${post.id}`}
                  className="block px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                      post.category === "BEAUTY" ? "bg-pink-500/15 text-pink-600 dark:text-pink-400" :
                      post.category === "QNA" ? "bg-blue-500/15 text-blue-600 dark:text-blue-400" :
                      post.category === "WORK" ? "bg-green-500/15 text-green-600 dark:text-green-400" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {post.category === "CHAT" ? "수다방" : post.category === "BEAUTY" ? "뷰티톡" : post.category === "QNA" ? "질문방" : "업소톡"}
                    </span>
                    <span className="min-w-0 truncate text-sm font-medium">{post.title}</span>
                    {post._count.comments > 0 && (
                      <span className="shrink-0 text-xs text-primary">[{post._count.comments}]</span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 pl-[calc(0.375rem+0.75rem+0.5rem)] text-[11px] text-muted-foreground">
                    <span>{post.author.name}</span>
                    <span>·</span>
                    <span>{formatDateSmart(post.createdAt)}</span>
                    <span>·</span>
                    <span>조회 {post.viewCount.toLocaleString()}</span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Desktop Table Layout */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">번호</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">제목</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">작성자</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">조회수</th>
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
                          <span className={`mr-1.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${
                            post.category === "BEAUTY" ? "bg-pink-500/15 text-pink-600 dark:text-pink-400" :
                            post.category === "QNA" ? "bg-blue-500/15 text-blue-600 dark:text-blue-400" :
                            post.category === "WORK" ? "bg-green-500/15 text-green-600 dark:text-green-400" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            {post.category === "CHAT" ? "수다방" : post.category === "BEAUTY" ? "뷰티톡" : post.category === "QNA" ? "질문방" : "업소톡"}
                          </span>
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
                      <td className="px-4 py-3 text-right text-sm text-muted-foreground">
                        {formatDateSmart(post.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                    href={`/community?${category ? `category=${category}&` : ""}page=${p}`}
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
