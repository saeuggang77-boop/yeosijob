import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CommentForm } from "@/components/community/CommentForm";
import { PostActions } from "@/components/community/PostActions";
import { CommentDeleteButton } from "@/components/community/CommentDeleteButton";

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
        select: { name: true },
      },
      comments: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          content: true,
          createdAt: true,
          authorId: true,
          author: {
            select: { name: true },
          },
        },
      },
    },
  });

  if (!post) {
    notFound();
  }

  const isAuthor = session?.user?.id === post.authorId;

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8">
      {/* Post */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{post.title}</h1>
              <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
                <span>{post.author.name}</span>
                <span>|</span>
                <span>{post.createdAt.toLocaleDateString("ko-KR")}</span>
                <span>|</span>
                <span>조회 {post.viewCount.toLocaleString()}</span>
              </div>
            </div>
            {isAuthor && <PostActions postId={post.id} />}
          </div>
        </CardHeader>
        <CardContent>
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {post.content}
          </div>
        </CardContent>
      </Card>

      {/* Back to List */}
      <div className="mt-4 flex justify-center">
        <Link href="/community">
          <Button variant="outline">목록으로</Button>
        </Link>
      </div>

      {/* Comments Section */}
      <div className="mt-8">
        <h2 className="mb-4 text-xl font-bold">
          댓글 <span className="text-primary">{post.comments.length}</span>
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
              const isCommentAuthor = session?.user?.id === comment.authorId;
              return (
                <Card key={comment.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">{comment.author.name}</span>
                          <span className="text-muted-foreground">
                            {comment.createdAt.toLocaleDateString("ko-KR")}
                          </span>
                        </div>
                        <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                          {comment.content}
                        </div>
                      </div>
                      {isCommentAuthor && (
                        <CommentDeleteButton postId={post.id} commentId={comment.id} />
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
