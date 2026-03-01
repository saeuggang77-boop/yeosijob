import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PostActions } from "@/components/community/PostActions";
import { ReportButton } from "@/components/community/ReportButton";
import { AdminUserMenu } from "@/components/community/AdminUserMenu";
import { ReactionButton } from "@/components/community/ReactionButton";
import { ImageGallery } from "@/components/community/ImageGallery";
import { CopyLinkButton } from "@/components/community/CopyLinkButton";
import { CommentSection } from "@/components/community/CommentSection";
import { formatDateSmart } from "@/lib/utils/format";
import { getCommunityAccess } from "@/lib/utils/community-access";
import { renderMarkdown } from "@/lib/utils/markdown";

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
  const idOrSlug = decodeURIComponent(id);
  const post = await findPostByIdOrSlug(idOrSlug);

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

  const session = await auth();

  // Check community access level
  const { level: accessLevel, reason: blurReason } = await getCommunityAccess(session);

  const postId = lookup.id;

  // Increment view count (even for blurred content - for SEO)
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
      isAnonymous: true,
      author: {
        select: { id: true, name: true, role: true, isActive: true },
      },
      images: {
        orderBy: { sortOrder: "asc" },
        select: { id: true, url: true },
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

  // 현재 유저의 반응 및 전체 반응 통계 조회
  const allPostLikes = await prisma.postLike.findMany({
    where: { postId },
    select: { userId: true, reactionType: true },
  });

  const postReactions: Record<string, number> = {};
  let userReaction: string | null = null;

  allPostLikes.forEach((like) => {
    const type = like.reactionType || "LIKE";
    postReactions[type] = (postReactions[type] || 0) + 1;
    if (session?.user?.id && like.userId === session.user.id) {
      userReaction = like.reactionType;
    }
  });

  // 댓글 좋아요 조회
  let likedCommentIds: Set<string> = new Set();
  if (session?.user?.id) {
    const commentLikeResults = await prisma.commentLike.findMany({
      where: {
        userId: session.user.id,
        comment: { postId },
      },
      select: { commentId: true },
    });
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

  // Determine if user can write (full access only)
  const canWrite = accessLevel === "full";

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      {/* Post */}
      <Card className="relative">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{post.title}</h1>
              <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
                {session?.user?.id && session.user.id !== post.author.id ? (
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
                <span>|</span>
                <span>{formatDateSmart(post.createdAt)}</span>
                <span>|</span>
                <span>조회 {post.viewCount.toLocaleString()}</span>
              </div>
            </div>
            {(isAuthor || isAdmin) && <PostActions postId={post.id} isAdmin={isAdmin} />}
          </div>
        </CardHeader>
        <CardContent className={accessLevel === "blur" ? "blur-sm pointer-events-none select-none" : ""}>
          {/* 마크다운 렌더링 */}
          <div
            className="prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
          />

          {/* 이미지 갤러리 */}
          {post.images.length > 0 && (
            <ImageGallery images={post.images} />
          )}

          {/* 게시글 반응 및 링크 복사 */}
          <div className="mt-6 flex items-center gap-3 border-t border-border pt-4">
            <ReactionButton
              postId={post.id}
              initialReactions={postReactions}
              initialUserReaction={userReaction}
              isLoggedIn={!!session}
            />
            <CopyLinkButton />
          </div>
        </CardContent>

        {/* Blur overlay */}
        {accessLevel === "blur" && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <Card className="mx-4 max-w-md">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="mb-4 text-lg font-semibold">
                    {blurReason === "not_logged_in"
                      ? "회원가입 후 커뮤니티를 이용하세요"
                      : "추천 이상 광고를 등록하면 커뮤니티를 열람할 수 있습니다"}
                  </p>
                  <Link href={blurReason === "not_logged_in" ? "/register" : "/pricing"}>
                    <Button size="lg">
                      {blurReason === "not_logged_in" ? "회원가입" : "광고 상품 보기"}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </Card>

      {/* Actions Bar */}
      <div className={`mt-4 flex items-center justify-between ${accessLevel === "blur" ? "blur-sm pointer-events-none select-none" : ""}`}>
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
      <div className={accessLevel === "blur" ? "blur-sm pointer-events-none select-none" : ""}>
        <CommentSection
          comments={commentsData}
          postId={post.id}
          postAuthorId={post.authorId}
          commentCount={commentCount}
          currentUserId={session?.user?.id}
          isAdmin={isAdmin}
          isLoggedIn={!!session}
          canWrite={canWrite}
        />
      </div>
    </div>
  );
}
