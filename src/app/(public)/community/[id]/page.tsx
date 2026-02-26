import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CommentForm } from "@/components/community/CommentForm";
import { PostActions } from "@/components/community/PostActions";
import { CommentDeleteButton } from "@/components/community/CommentDeleteButton";
import { ReplyButton } from "@/components/community/ReplyButton";
import { ReportButton } from "@/components/community/ReportButton";
import { AdminUserMenu } from "@/components/community/AdminUserMenu";
import { formatDateSmart } from "@/lib/utils/format";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const post = await prisma.post.findUnique({
    where: { id },
    select: { title: true, content: true },
  });

  if (!post) {
    return { title: "게시글을 찾을 수 없습니다" };
  }

  return {
    title: post.title,
    description: post.content.substring(0, 100),
    openGraph: {
      type: "article",
      title: `${post.title} | 여시잡`,
      description: post.content.substring(0, 100),
    },
  };
}

export default async function PostDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();

  // Increment view count
  await prisma.post.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  });

  const post = await prisma.post.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      content: true,
      createdAt: true,
      viewCount: true,
      authorId: true,
      author: {
        select: { id: true, name: true, role: true },
      },
      comments: {
        where: { parentId: null },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          content: true,
          createdAt: true,
          authorId: true,
          author: {
            select: { id: true, name: true, role: true },
          },
          replies: {
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              content: true,
              createdAt: true,
              authorId: true,
              author: {
                select: { id: true, name: true, role: true },
              },
            },
          },
        },
      },
    },
  });

  // Get total comment count (including replies)
  const commentCount = await prisma.comment.count({ where: { postId: id } });

  if (!post) {
    notFound();
  }

  const isAuthor = session?.user?.id === post.authorId;
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8">
      {/* Post */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{post.title}</h1>
              <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
                {isAdmin && session.user.id !== post.author.id ? (
                  <AdminUserMenu
                    userId={post.author.id}
                    userName={post.author.name || "익명"}
                    currentRole={post.author.role}
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
      <div className="mt-8">
        <h2 className="mb-4 text-xl font-bold">
          댓글 <span className="text-primary">{commentCount}</span>
        </h2>

        {/* Comment Form */}
        <div className="mb-6">
          <CommentForm postId={post.id} />
        </div>

        {/* Comments List */}
        {post.comments.length === 0 ? (
          <div className="rounded-md border border-border bg-muted/30 py-12 text-center text-sm text-muted-foreground">
            첫 댓글을 작성해보세요
          </div>
        ) : (
          <div className="space-y-4">
            {post.comments.map((comment) => {
              const canDeleteComment = isAdmin || session?.user?.id === comment.authorId;
              return (
                <div key={comment.id} className="space-y-2">
                  {/* Top-level Comment */}
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-sm">
                            {isAdmin && session?.user?.id !== comment.author.id ? (
                              <AdminUserMenu
                                userId={comment.author.id}
                                userName={comment.author.name || "익명"}
                                currentRole={comment.author.role}
                                isPostAuthor={comment.authorId === post.authorId}
                              />
                            ) : (
                              <>
                                <span className="font-medium">{comment.author.name}</span>
                                {comment.authorId === post.authorId && (
                                  <span className="rounded bg-primary/20 px-1.5 py-0.5 text-xs font-semibold text-primary">
                                    작성자
                                  </span>
                                )}
                              </>
                            )}
                            <span className="text-muted-foreground">
                              {formatDateSmart(comment.createdAt)}
                            </span>
                          </div>
                          <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                            {comment.content}
                          </div>
                          <div className="mt-2">
                            <ReplyButton
                              postId={post.id}
                              parentId={comment.id}
                              replyToName={comment.author.name || "익명"}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {session?.user?.id !== comment.authorId && (
                            <ReportButton commentId={comment.id} isLoggedIn={!!session} />
                          )}
                          {canDeleteComment && (
                            <CommentDeleteButton postId={post.id} commentId={comment.id} />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="ml-8 space-y-2 border-l-2 border-primary/20 pl-4">
                      {comment.replies.map((reply) => {
                        const canDeleteReply = isAdmin || session?.user?.id === reply.authorId;
                        // Highlight @mentions in gold
                        const contentParts = reply.content.split(/(@\S+)/g);
                        return (
                          <Card key={reply.id} className="bg-muted/30">
                            <CardContent className="py-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 text-sm">
                                    {isAdmin && session?.user?.id !== reply.author.id ? (
                                      <AdminUserMenu
                                        userId={reply.author.id}
                                        userName={reply.author.name || "익명"}
                                        currentRole={reply.author.role}
                                        isPostAuthor={reply.authorId === post.authorId}
                                      />
                                    ) : (
                                      <>
                                        <span className="font-medium">{reply.author.name}</span>
                                        {reply.authorId === post.authorId && (
                                          <span className="rounded bg-primary/20 px-1.5 py-0.5 text-xs font-semibold text-primary">
                                            작성자
                                          </span>
                                        )}
                                      </>
                                    )}
                                    <span className="text-muted-foreground">
                                      {formatDateSmart(reply.createdAt)}
                                    </span>
                                  </div>
                                  <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                                    {contentParts.map((part, idx) =>
                                      part.startsWith("@") ? (
                                        <span key={idx} className="text-primary font-medium">
                                          {part}
                                        </span>
                                      ) : (
                                        <span key={idx}>{part}</span>
                                      )
                                    )}
                                  </div>
                                  <div className="mt-2">
                                    <ReplyButton
                                      postId={post.id}
                                      parentId={comment.id}
                                      replyToName={reply.author.name || "익명"}
                                    />
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {session?.user?.id !== reply.authorId && (
                                    <ReportButton commentId={reply.id} isLoggedIn={!!session} />
                                  )}
                                  {canDeleteReply && (
                                    <CommentDeleteButton postId={post.id} commentId={reply.id} />
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
