import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDateSmart } from "@/lib/utils/format";
import { PostDeleteButton } from "@/components/community/PostDeleteButton";
import { AdminUserMenu } from "@/components/community/AdminUserMenu";
import { SearchForm } from "@/components/community/SearchForm";

function isNewPost(createdAt: Date): boolean {
  return Date.now() - new Date(createdAt).getTime() < 24 * 60 * 60 * 1000;
}

export const metadata = {
  title: "커뮤니티",
  description: "유흥업계 종사자들의 커뮤니티 게시판",
  openGraph: {
    title: "커뮤니티 | 여시잡",
    description: "유흥업계 종사자들의 커뮤니티 게시판",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "여시잡 - 유흥알바 No.1 구인구직" }],
  },
  alternates: {
    canonical: "/community",
  },
};

const CATEGORIES = [
  { key: "", label: "전체" },
  { key: "CHAT", label: "수다톡" },
  { key: "BEAUTY", label: "뷰티톡" },
  { key: "QNA", label: "질문톡" },
  { key: "WORK", label: "가게톡" },
];

interface PageProps {
  searchParams: Promise<{
    page?: string;
    category?: string;
    q?: string;
    sort?: string;
    period?: string;
  }>;
}

export default async function CommunityPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const category = params.category || "";
  const query = params.q || "";
  const sort = params.sort || "latest";
  const isBest = sort === "weekly" || sort === "monthly";
  const limit = isBest ? 20 : 15;

  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  const where: Record<string, unknown> = {};
  // Exclude deleted and hidden posts
  where.deletedAt = null;
  if (!isAdmin) {
    where.isHidden = false;
  }
  if (category && ["CHAT", "BEAUTY", "QNA", "WORK"].includes(category)) {
    where.category = category;
  }
  if (query.trim()) {
    where.OR = [
      { title: { contains: query.trim() } },
      { content: { contains: query.trim() } },
    ];
  }

  // Best posts: period filter
  if (sort === "weekly") {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    where.createdAt = { gte: cutoff };
  } else if (sort === "monthly") {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    where.createdAt = { gte: cutoff };
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: isBest
        ? [
            { likes: { _count: "desc" } },
            { comments: { _count: "desc" } },
            { viewCount: "desc" },
          ]
        : { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        slug: true,
        title: true,
        category: true,
        createdAt: true,
        viewCount: true,
        authorId: true,
        isAnonymous: true,
        isHidden: true,
        author: {
          select: { id: true, name: true, role: true, isActive: true },
        },
        _count: {
          select: {
            comments: { where: { deletedAt: null } },
            likes: true,
            images: true,
          },
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

      {/* Best Tabs (toggle: click again to deselect) */}
      <div className="mb-4 flex gap-2">
        {[
          { key: "weekly", label: "🔥 주간 베스트", activeClass: "bg-red-500/12 border-red-500/40 text-red-400 hover:bg-red-500/20" },
          { key: "monthly", label: "🏆 월간 베스트", activeClass: "bg-[#D4A853]/15 border-[#D4A853] text-[#D4A853] hover:bg-[#D4A853]/25" },
        ].map((tab) => {
          const isActive = sort === tab.key;
          const params = new URLSearchParams();
          if (category) params.set("category", category);
          if (query) params.set("q", query);
          if (!isActive) params.set("sort", tab.key);
          const href = `/community${params.toString() ? `?${params.toString()}` : ""}`;

          return (
            <Link key={tab.key} href={href}>
              <Button
                variant="outline"
                size="sm"
                className={isActive ? tab.activeClass : ""}
              >
                {tab.label}
              </Button>
            </Link>
          );
        })}
      </div>

      {/* Category Tabs */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((tab) => {
          const params = new URLSearchParams();
          if (tab.key) params.set("category", tab.key);
          if (query) params.set("q", query);
          // "전체"는 베스트 필터도 해제, 개별 카테고리는 베스트 유지
          if (tab.key && isBest) params.set("sort", sort);
          const href = `/community${params.toString() ? `?${params.toString()}` : ""}`;

          return (
            <Link key={tab.key} href={href}>
              <Button
                variant={category === tab.key ? "default" : "outline"}
                size="sm"
              >
                {tab.label}
              </Button>
            </Link>
          );
        })}
      </div>

      {/* Search Form */}
      <SearchForm />

      {/* Search Results Info */}
      {query && (
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span>검색어: <strong className="text-foreground">{query}</strong></span>
          <span>·</span>
          <span>검색 결과: <strong className="text-foreground">{total}건</strong></span>
        </div>
      )}

      {/* Post List */}
      <Card className="overflow-hidden">
        {posts.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            {query ? (
              <>
                <p className="text-lg">검색 결과가 없습니다</p>
                <p className="mt-1 text-sm">다른 검색어로 시도해보세요</p>
              </>
            ) : (
              <>
                <p className="text-lg">등록된 게시글이 없습니다</p>
                <p className="mt-1 text-sm">첫 게시글을 작성해보세요!</p>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Mobile Card Layout */}
            <div className="md:hidden divide-y divide-border">
              {posts.map((post, idx) => (
                <Link
                  key={post.id}
                  href={`/community/${post.slug || post.id}`}
                  className="block px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    {isBest && (
                      <span className={`shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-extrabold ${
                        (page - 1) * limit + idx === 0 ? "bg-gradient-to-br from-[#D4A853] to-[#b8902e] text-black" :
                        (page - 1) * limit + idx === 1 ? "bg-white/10 text-zinc-300" :
                        (page - 1) * limit + idx === 2 ? "bg-amber-900/30 text-amber-600" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {(page - 1) * limit + idx + 1}
                      </span>
                    )}
                    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                      post.category === "BEAUTY" ? "bg-pink-500/15 text-pink-600 dark:text-pink-400" :
                      post.category === "QNA" ? "bg-blue-500/15 text-blue-600 dark:text-blue-400" :
                      post.category === "WORK" ? "bg-green-500/15 text-green-600 dark:text-green-400" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {post.category === "CHAT" ? "수다톡" : post.category === "BEAUTY" ? "뷰티톡" : post.category === "QNA" ? "질문톡" : "가게톡"}
                    </span>
                    <span className="min-w-0 truncate text-sm font-medium">{post.title}</span>
                    {post.isHidden && (
                      <span className="ml-1.5 inline-flex items-center gap-0.5 rounded bg-white/[0.08] px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        🔒 비공개
                      </span>
                    )}
                    {post._count.images > 0 && (
                      <span className="shrink-0 text-xs" title="이미지 첨부">📷</span>
                    )}
                    {post._count.comments > 0 && (
                      <span className="shrink-0 text-xs text-primary">[{post._count.comments}]</span>
                    )}
                    {isNewPost(post.createdAt) && (
                      <span className="ml-1 shrink-0 rounded-sm bg-red-500/15 px-1 py-0.5 text-[10px] font-bold leading-none text-red-400">N</span>
                    )}
                  </div>
                  <div className={`mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground ${isBest ? "pl-8" : "pl-[calc(0.375rem+0.75rem+0.5rem)]"}`}>
                    {session?.user?.id && session.user.id !== post.authorId ? (
                      <AdminUserMenu
                        userId={post.author.id}
                        userName={
                          post.isAnonymous
                            ? isAdmin
                              ? `익명 (${post.author.name})`
                              : "익명"
                            : post.author.name || "익명"
                        }
                        currentRole={post.author.role}
                        isAdmin={isAdmin}
                        isUserActive={post.author.isActive}
                      />
                    ) : (
                      <span>
                        {post.isAnonymous
                          ? isAdmin
                            ? `익명 (${post.author.name})`
                            : "익명"
                          : post.author.name}
                      </span>
                    )}
                    <span>·</span>
                    <span>{formatDateSmart(post.createdAt)}</span>
                    <span>·</span>
                    <span>조회 {post.viewCount.toLocaleString()}</span>
                    {post._count.likes > 0 && (
                      <>
                        <span>·</span>
                        <span>{isBest ? `👍 ${post._count.likes}` : `추천 ${post._count.likes}`}</span>
                      </>
                    )}
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
                    <th className="px-4 py-3 text-center text-sm font-semibold">추천</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">조회수</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">작성일</th>
                    {isAdmin && <th className="px-4 py-3 text-center text-sm font-semibold w-16">관리</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {posts.map((post, idx) => (
                    <tr key={post.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {isBest ? (
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-extrabold ${
                            (page - 1) * limit + idx === 0 ? "bg-gradient-to-br from-[#D4A853] to-[#b8902e] text-black" :
                            (page - 1) * limit + idx === 1 ? "bg-white/10 text-zinc-300" :
                            (page - 1) * limit + idx === 2 ? "bg-amber-900/30 text-amber-600" :
                            ""
                          }`}>
                            {(page - 1) * limit + idx + 1}
                          </span>
                        ) : (
                          total - (page - 1) * limit - idx
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/community/${post.slug || post.id}`} className="hover:underline">
                          <span className={`mr-1.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${
                            post.category === "BEAUTY" ? "bg-pink-500/15 text-pink-600 dark:text-pink-400" :
                            post.category === "QNA" ? "bg-blue-500/15 text-blue-600 dark:text-blue-400" :
                            post.category === "WORK" ? "bg-green-500/15 text-green-600 dark:text-green-400" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            {post.category === "CHAT" ? "수다톡" : post.category === "BEAUTY" ? "뷰티톡" : post.category === "QNA" ? "질문톡" : "가게톡"}
                          </span>
                          <span className="text-sm font-medium">{post.title}</span>
                          {post.isHidden && (
                            <span className="ml-1.5 inline-flex items-center gap-0.5 rounded bg-white/[0.08] px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                              🔒 비공개
                            </span>
                          )}
                          {post._count.images > 0 && (
                            <span className="ml-1.5 text-xs" title="이미지 첨부">📷</span>
                          )}
                          {post._count.comments > 0 && (
                            <span className="ml-1.5 text-xs text-primary">
                              [{post._count.comments}]
                            </span>
                          )}
                          {isNewPost(post.createdAt) && (
                            <span className="ml-1.5 inline-block rounded-sm bg-red-500/15 px-1 py-0.5 text-[10px] font-bold leading-none text-red-400">N</span>
                          )}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {session?.user?.id && session.user.id !== post.authorId ? (
                          <AdminUserMenu
                            userId={post.author.id}
                            userName={
                              post.isAnonymous
                                ? isAdmin
                                  ? `익명 (${post.author.name})`
                                  : "익명"
                                : post.author.name || "익명"
                            }
                            currentRole={post.author.role}
                            isAdmin={isAdmin}
                            isUserActive={post.author.isActive}
                          />
                        ) : (
                          post.isAnonymous
                            ? isAdmin
                              ? `익명 (${post.author.name})`
                              : "익명"
                            : post.author.name
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-muted-foreground">
                        {post._count.likes > 0 ? (
                          <span>👍 {post._count.likes}</span>
                        ) : (
                          <span>0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-muted-foreground">
                        {post.viewCount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-muted-foreground">
                        {formatDateSmart(post.createdAt)}
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-center">
                          <PostDeleteButton postId={post.id} />
                        </td>
                      )}
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

              const pageParams = new URLSearchParams();
              if (category) pageParams.set("category", category);
              if (query) pageParams.set("q", query);
              if (sort) pageParams.set("sort", sort);
              pageParams.set("page", String(p));

              return (
                <span key={p}>
                  {showEllipsis && (
                    <span className="px-2 text-muted-foreground">...</span>
                  )}
                  <Link
                    href={`/community?${pageParams.toString()}`}
                    scroll={false}
                    className={`inline-flex h-10 w-10 items-center justify-center rounded text-sm ${
                      p === page
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    {p}
                  </Link>
                </span>
              );
            })}
        </div>
      )}
    </div>
  );
}
