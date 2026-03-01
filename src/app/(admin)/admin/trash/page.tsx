import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TrashActions } from "@/components/admin/TrashActions";

interface PageProps {
  searchParams: Promise<{
    tab?: string;
    page?: string;
  }>;
}

export default async function AdminTrashPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const params = await searchParams;
  const tab = params.tab || "posts";
  const page = parseInt(params.page || "1", 10);
  const limit = 20;

  let posts: any[] = [];
  let comments: any[] = [];
  let totalPosts = 0;
  let totalComments = 0;

  if (tab === "posts") {
    [posts, totalPosts] = await Promise.all([
      prisma.post.findMany({
        where: { deletedAt: { not: null } },
        orderBy: { deletedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          content: true,
          createdAt: true,
          deletedAt: true,
          deletedBy: true,
          author: { select: { name: true, email: true } },
          _count: { select: { comments: true } },
        },
      }),
      prisma.post.count({ where: { deletedAt: { not: null } } }),
    ]);
  } else {
    [comments, totalComments] = await Promise.all([
      prisma.comment.findMany({
        where: { deletedAt: { not: null } },
        orderBy: { deletedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          content: true,
          createdAt: true,
          deletedAt: true,
          deletedBy: true,
          postId: true,
          post: { select: { title: true } },
          author: { select: { name: true, email: true } },
        },
      }),
      prisma.comment.count({ where: { deletedAt: { not: null } } }),
    ]);
  }

  const total = tab === "posts" ? totalPosts : totalComments;
  const totalPages = Math.ceil(total / limit);

  function buildUrl(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    const t = overrides.tab ?? tab;
    const pg = overrides.page ?? String(page);
    if (t && t !== "posts") p.set("tab", t);
    if (pg !== "1") p.set("page", pg);
    return `/admin/trash${p.toString() ? `?${p.toString()}` : ""}`;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">휴지통</h1>
        <span className="text-sm text-muted-foreground">
          총 {tab === "posts" ? totalPosts : totalComments}건
        </span>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-2 border-b">
        <a
          href={buildUrl({ tab: "posts", page: "1" })}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            tab === "posts"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          게시글 ({totalPosts})
        </a>
        <a
          href={buildUrl({ tab: "comments", page: "1" })}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            tab === "comments"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          댓글 ({totalComments})
        </a>
      </div>

      {/* Posts Table */}
      {tab === "posts" && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-3 font-medium">제목</th>
                <th className="pb-3 font-medium">작성자</th>
                <th className="pb-3 font-medium">댓글수</th>
                <th className="pb-3 font-medium">작성일</th>
                <th className="pb-3 font-medium">삭제일</th>
                <th className="pb-3 font-medium">삭제자</th>
                <th className="pb-3 font-medium text-right">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-muted/50">
                  <td className="py-3">
                    <div className="max-w-md">
                      <div className="truncate font-medium">{post.title}</div>
                      <div className="mt-1 truncate text-xs text-muted-foreground">
                        {post.content.substring(0, 100)}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-muted-foreground">
                    {post.author.name || post.author.email}
                  </td>
                  <td className="py-3 text-muted-foreground">
                    {post._count.comments}
                  </td>
                  <td className="py-3 text-muted-foreground">
                    {new Date(post.createdAt).toLocaleDateString("ko-KR")}
                  </td>
                  <td className="py-3 text-muted-foreground">
                    {post.deletedAt
                      ? new Date(post.deletedAt).toLocaleString("ko-KR")
                      : "-"}
                  </td>
                  <td className="py-3 text-muted-foreground">
                    {post.deletedBy ? post.deletedBy.slice(0, 8) + "..." : "-"}
                  </td>
                  <td className="py-3 text-right">
                    <TrashActions type="post" id={post.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {posts.length === 0 && (
            <p className="py-12 text-center text-muted-foreground">
              삭제된 게시글이 없습니다
            </p>
          )}
        </div>
      )}

      {/* Comments Table */}
      {tab === "comments" && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-3 font-medium">내용</th>
                <th className="pb-3 font-medium">게시글</th>
                <th className="pb-3 font-medium">작성자</th>
                <th className="pb-3 font-medium">작성일</th>
                <th className="pb-3 font-medium">삭제일</th>
                <th className="pb-3 font-medium">삭제자</th>
                <th className="pb-3 font-medium text-right">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {comments.map((comment) => (
                <tr key={comment.id} className="hover:bg-muted/50">
                  <td className="py-3">
                    <div className="max-w-md truncate">{comment.content}</div>
                  </td>
                  <td className="py-3 text-muted-foreground">
                    <div className="max-w-xs truncate">{comment.post.title}</div>
                  </td>
                  <td className="py-3 text-muted-foreground">
                    {comment.author.name || comment.author.email}
                  </td>
                  <td className="py-3 text-muted-foreground">
                    {new Date(comment.createdAt).toLocaleDateString("ko-KR")}
                  </td>
                  <td className="py-3 text-muted-foreground">
                    {comment.deletedAt
                      ? new Date(comment.deletedAt).toLocaleString("ko-KR")
                      : "-"}
                  </td>
                  <td className="py-3 text-muted-foreground">
                    {comment.deletedBy ? comment.deletedBy.slice(0, 8) + "..." : "-"}
                  </td>
                  <td className="py-3 text-right">
                    <TrashActions type="comment" id={comment.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {comments.length === 0 && (
            <p className="py-12 text-center text-muted-foreground">
              삭제된 댓글이 없습니다
            </p>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-1">
          {page > 1 && (
            <a
              href={buildUrl({ page: String(page - 1) })}
              className="inline-flex h-10 w-10 items-center justify-center rounded text-sm hover:bg-muted"
            >
              ←
            </a>
          )}
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
            const p = Math.max(1, Math.min(page - 4, totalPages - 9)) + i;
            if (p > totalPages) return null;
            return (
              <a
                key={p}
                href={buildUrl({ page: String(p) })}
                className={`inline-flex h-10 w-10 items-center justify-center rounded text-sm ${
                  p === page
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                {p}
              </a>
            );
          })}
          {page < totalPages && (
            <a
              href={buildUrl({ page: String(page + 1) })}
              className="inline-flex h-10 w-10 items-center justify-center rounded text-sm hover:bg-muted"
            >
              →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
