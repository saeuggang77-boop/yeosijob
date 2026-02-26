import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PostActions } from "@/components/community/PostActions";
import { ReportButton } from "@/components/community/ReportButton";
import { AdminUserMenu } from "@/components/community/AdminUserMenu";
import { LikeButton } from "@/components/community/LikeButton";
import { CommentSection } from "@/components/community/CommentSection";
import { formatDateSmart } from "@/lib/utils/format";

interface PageProps {
  params: Promise<{ id: string }>;
}

// slug 또는 cuid로 게시글 조회
async function findPostByIdOrSlug(idOrSlug: string) {
  // 먼저 slug로 검색 (findFirst: PrismaPg 어댑터 호환)
  const bySlug = await prisma.post.findFirst({
    where: { slug: idOrSlug },
    select: { id: true, slug: true, title: true, content: true },
  });
  if (bySlug) return bySlug;

  // slug로 못 찾으면 cuid로 검색
  const byId = await prisma.post.findFirst({
    where: { id: idOrSlug },
    select: { id: true, slug: true, title: true, content: true },
  });
  return byId;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const post = await findPostByIdOrSlug(decodeURIComponent(id));

  if (!post) {
    return { title: "게시글을 찾을 수 없습니다" };
  }

  const description = post.content.substring(0, 155).replace(/\n/g, ' ');
  const canonicalId = post.slug || post.id;

  return {
    title: post.title,
    description,
    alternates: {
      canonical: `/community/${canonicalId}`,
    },
    openGraph: {
      type: "article",
      title: `${post.title} | 여시잡`,
      description,
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "여시잡 - 유흥알바 No.1 구인구직" }],
    },
  };
}

export default async function PostDetailPage({ params }: PageProps) {
  const { id: rawIdOrSlug } = await params;
  const idOrSlug = decodeURIComponent(rawIdOrSlug);

  // slug 또는 cuid로 게시글 찾기
  const lookup = await findPostByIdOrSlug(idOrSlug);
  if (!lookup) notFound();

  // cuid로 접근했는데 slug가 있으면 slug URL로 301 리다이렉트 (SEO)
  if (lookup.slug && idOrSlug !== lookup.slug && idOrSlug !== encodeURIComponent(lookup.slug)) {
    permanentRedirect(`/community/${encodeURIComponent(lookup.slug)}`);
  }

  const session = await auth();

  const postId = lookup.id;

  // Increment view count
  await prisma.post.update({
    where: { id: postId },
    data: { viewCount: { increment: 1 } },
  });

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      title: true,
      content: true,
      createdAt: true,
      viewCount: true,
      authorId: true,
      author: {
        select: { id: true, name: true, role: true, isActive: true },
      },
      _count: { select: { likes: true } },
      comments: {
        where: { parentId: null },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          content: true,
          createdAt: true,
          authorId: true,
          author: {
            select: { id: true, name: true, role: true, isActive: true },
          },
          _count: { select: { likes: true } },
          replies: {
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              content: true,
              createdAt: true,
              authorId: true,
              author: {
                select: { id: true, name: true, role: true, isActive: true },
              },
              _count: { select: { likes: true } },
            },
          },
        },
      },
    },
  });

  // Get total comment count (including replies)
  const commentCount = await prisma.comment.count({ where: { postId } });

  if (!post) {
    notFound();
  }

  // 현재 유저의 좋아요 여부 조회 (로그인 시)
  let postLiked = false;
  let likedCommentIds: Set<string> = new Set();

  if (session?.user?.id) {
    const [postLikeResult, commentLikeResults] = await Promise.all([
      prisma.postLike.findUnique({
        where: { userId_postId: { userId: session.user.id, postId } },
      }),
      prisma.commentLike.findMany({
        where: {
          userId: session.user.id,
          comment: { postId },
        },
        select: { commentId: true },
      }),
    ]);

    postLiked = !!postLikeResult;
    likedCommentIds = new Set(commentLikeResults.map((l) => l.commentId));
  }

  const isAuthor = session?.user?.id === post.authorId;
  const isAdmin = session?.user?.role === "ADMIN";

  // 댓글 데이터를 CommentSection에 전달할 형태로 변환
  const commentsData = post.comments.map((comment) => ({
    id: comment.id,
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
    authorId: comment.authorId,
    author: comment.author,
    likeCount: comment._count.likes,
    liked: likedCommentIds.has(comment.id),
    replies: comment.replies.map((reply) => ({
      id: reply.id,
      content: reply.content,
      createdAt: reply.createdAt.toISOString(),
      authorId: reply.authorId,
      author: reply.author,
      likeCount: reply._count.likes,
      liked: likedCommentIds.has(reply.id),
    })),
  }));

  // JSON-LD 구조화 데이터
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DiscussionForumPosting",
    headline: post.title,
    text: post.content.substring(0, 200),
    datePublished: post.createdAt.toISOString(),
    author: {
      "@type": "Person",
      name: post.author.name || "익명",
    },
    interactionStatistic: [
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/CommentAction",
        userInteractionCount: commentCount,
      },
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/LikeAction",
        userInteractionCount: post._count.likes,
      },
    ],
    url: `https://yeosijob.com/community/${lookup.slug || postId}`,
  };

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Post */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{post.title}</h1>
              <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
                {session?.user?.id && session.user.id !== post.author.id ? (
                  <AdminUserMenu
                    userId={post.author.id}
                    userName={post.author.name || "익명"}
                    currentRole={post.author.role}
                    isAdmin={isAdmin}
                    isUserActive={post.author.isActive}
                  />
                ) : (
                  <span>{post.author.name}</span>
                )}
                <span>|</span>
                <span>{formatDateSmart(post.createdAt)}</span>
                <span>|</span>
                <span>조회 {post.viewCount.toLocaleString()}</span>
              </div>
            </div>
            {(isAuthor || isAdmin) && <PostActions postId={post.id} />}
          </div>
        </CardHeader>
        <CardContent>
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {post.content}
          </div>
          {/* 게시글 좋아요 */}
          <div className="mt-4 border-t border-border pt-4">
            <LikeButton
              type="post"
              targetId={post.id}
              postId={post.id}
              initialLiked={postLiked}
              initialCount={post._count.likes}
              isLoggedIn={!!session}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions Bar */}
      <div className="mt-4 flex items-center justify-between">
        <div>
          {!isAuthor && (
            <ReportButton postId={post.id} isLoggedIn={!!session} />
          )}
        </div>
        <Link href="/community">
          <Button variant="outline">목록으로</Button>
        </Link>
      </div>

      {/* Comments Section */}
      <CommentSection
        comments={commentsData}
        postId={post.id}
        postAuthorId={post.authorId}
        commentCount={commentCount}
        currentUserId={session?.user?.id}
        isAdmin={isAdmin}
        isLoggedIn={!!session}
      />
    </div>
  );
}
