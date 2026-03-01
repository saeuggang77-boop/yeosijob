"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CommentForm } from "./CommentForm";
import { ReplyButton } from "./ReplyButton";
import { CommentDeleteButton } from "./CommentDeleteButton";
import { CommentEditButton } from "./CommentEditButton";
import { ReportButton } from "./ReportButton";
import { AdminUserMenu } from "./AdminUserMenu";
import { LikeButton } from "./LikeButton";
import { formatDateSmart } from "@/lib/utils/format";

interface AuthorData {
  id: string;
  name: string | null;
  role: string;
  isActive: boolean;
}

interface ReplyData {
  id: string;
  content: string;
  createdAt: string;
  authorId: string;
  author: AuthorData;
  likeCount: number;
  liked: boolean;
}

interface CommentData {
  id: string;
  content: string;
  createdAt: string;
  authorId: string;
  author: AuthorData;
  likeCount: number;
  liked: boolean;
  replies: ReplyData[];
}

interface CommentSectionProps {
  comments: CommentData[];
  postId: string;
  postAuthorId: string;
  commentCount: number;
  currentUserId?: string;
  isAdmin: boolean;
  isLoggedIn: boolean;
  canWrite?: boolean;
  isAnonymousPost?: boolean;
}

export function CommentSection({
  comments,
  postId,
  postAuthorId,
  commentCount,
  currentUserId,
  isAdmin,
  isLoggedIn,
  canWrite = true,
  isAnonymousPost = false,
}: CommentSectionProps) {
  // 익명 게시글에서 글쓴이의 표시 이름 결정
  const getDisplayName = (authorId: string, authorName: string | null) => {
    if (isAnonymousPost && authorId === postAuthorId) {
      return isAdmin ? `글쓴이 (${authorName})` : "글쓴이";
    }
    return authorName || "익명";
  };

  // 익명 게시글에서 작성자 배지 표시 여부
  const showAuthorBadge = (authorId: string) => {
    if (isAnonymousPost) return false; // 익명글에서는 작성자 배지 숨김
    return authorId === postAuthorId;
  };
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const sortedComments = useMemo(() => {
    return [...comments].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });
  }, [comments, sortOrder]);

  return (
    <div className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">
          댓글 <span className="text-primary">{commentCount}</span>
        </h2>

        {/* 정렬 토글 */}
        <div className="flex rounded-lg border border-border text-sm">
          <button
            onClick={() => setSortOrder("asc")}
            className={`px-3 py-1.5 transition-colors ${
              sortOrder === "asc"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
          >
            등록순
          </button>
          <button
            onClick={() => setSortOrder("desc")}
            className={`px-3 py-1.5 transition-colors ${
              sortOrder === "desc"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
          >
            최신순
          </button>
        </div>
      </div>

      {/* Comment Form */}
      <div className="mb-6">
        <CommentForm postId={postId} canWrite={canWrite} />
      </div>

      {/* Comments List */}
      {sortedComments.length === 0 ? (
        <div className="rounded-md border border-border bg-muted/30 py-12 text-center text-sm text-muted-foreground">
          첫 댓글을 작성해보세요
        </div>
      ) : (
        <div className="space-y-4">
          {sortedComments.map((comment) => {
            const canDeleteComment = isAdmin;
            const canEditComment = isAdmin || currentUserId === comment.authorId;
            return (
              <div key={comment.id} className="space-y-2">
                {/* Top-level Comment */}
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
                          {currentUserId && currentUserId !== comment.author.id ? (
                            <AdminUserMenu
                              userId={comment.author.id}
                              userName={getDisplayName(comment.authorId, comment.author.name)}
                              currentRole={comment.author.role}
                              isPostAuthor={showAuthorBadge(comment.authorId)}
                              isAdmin={isAdmin}
                              isUserActive={comment.author.isActive}
                            />
                          ) : (
                            <>
                              <span className="max-w-[120px] truncate font-medium sm:max-w-none">{getDisplayName(comment.authorId, comment.author.name)}</span>
                              {showAuthorBadge(comment.authorId) && (
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
                        <div className="mt-2 flex items-center gap-3">
                          <LikeButton
                            type="comment"
                            targetId={comment.id}
                            postId={postId}
                            initialLiked={comment.liked}
                            initialCount={comment.likeCount}
                            isLoggedIn={isLoggedIn}
                          />
                          {canWrite && (
                            <ReplyButton
                              postId={postId}
                              parentId={comment.id}
                              replyToName={getDisplayName(comment.authorId, comment.author.name)}
                            />
                          )}
                          {currentUserId !== comment.authorId && (
                            <ReportButton commentId={comment.id} isLoggedIn={isLoggedIn} />
                          )}
                        </div>
                      </div>
                      {(canEditComment || canDeleteComment) && (
                        <div className="flex shrink-0 items-center gap-1">
                          {canEditComment && (
                            <CommentEditButton postId={postId} commentId={comment.id} initialContent={comment.content} />
                          )}
                          {canDeleteComment && (
                            <CommentDeleteButton postId={postId} commentId={comment.id} />
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="ml-4 space-y-2 border-l-2 border-primary/20 pl-3 sm:ml-8 sm:pl-4">
                    {comment.replies.map((reply) => {
                      const canDeleteReply = isAdmin;
                      const canEditReply = isAdmin || currentUserId === reply.authorId;
                      const contentParts = reply.content.split(/(@\S+)/g);
                      return (
                        <Card key={reply.id} className="bg-muted/30">
                          <CardContent className="py-3">
                            <div className="flex items-start justify-between gap-1">
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
                                  {currentUserId && currentUserId !== reply.author.id ? (
                                    <AdminUserMenu
                                      userId={reply.author.id}
                                      userName={getDisplayName(reply.authorId, reply.author.name)}
                                      currentRole={reply.author.role}
                                      isPostAuthor={showAuthorBadge(reply.authorId)}
                                      isAdmin={isAdmin}
                                      isUserActive={reply.author.isActive}
                                    />
                                  ) : (
                                    <>
                                      <span className="max-w-[120px] truncate font-medium sm:max-w-none">{getDisplayName(reply.authorId, reply.author.name)}</span>
                                      {showAuthorBadge(reply.authorId) && (
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
                                <div className="mt-2 flex items-center gap-3">
                                  <LikeButton
                                    type="comment"
                                    targetId={reply.id}
                                    postId={postId}
                                    initialLiked={reply.liked}
                                    initialCount={reply.likeCount}
                                    isLoggedIn={isLoggedIn}
                                  />
                                  {canWrite && (
                                    <ReplyButton
                                      postId={postId}
                                      parentId={comment.id}
                                      replyToName={getDisplayName(reply.authorId, reply.author.name)}
                                    />
                                  )}
                                  {currentUserId !== reply.authorId && (
                                    <ReportButton commentId={reply.id} isLoggedIn={isLoggedIn} />
                                  )}
                                </div>
                              </div>
                              {(canEditReply || canDeleteReply) && (
                                <div className="flex shrink-0 items-center gap-1">
                                  {canEditReply && (
                                    <CommentEditButton postId={postId} commentId={reply.id} initialContent={reply.content} />
                                  )}
                                  {canDeleteReply && (
                                    <CommentDeleteButton postId={postId} commentId={reply.id} />
                                  )}
                                </div>
                              )}
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
  );
}
