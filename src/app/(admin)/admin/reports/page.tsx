import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { formatDateSmart } from "@/lib/utils/format";
import { ReportActions } from "@/components/admin/ReportActions";

export const metadata = {
  title: "신고 관리",
};

const REASON_LABELS: Record<string, string> = {
  ABUSE: "욕설/비방",
  OBSCENE: "음란물",
  SPAM: "광고/홍보",
  PRIVACY: "개인정보노출",
  OTHER: "기타",
};

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  PENDING: { label: "대기", className: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400" },
  RESOLVED: { label: "처리완료", className: "bg-green-500/15 text-green-600 dark:text-green-400" },
  DISMISSED: { label: "반려", className: "bg-muted text-muted-foreground" },
};

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminReportsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const statusFilter = params.status || "PENDING";

  const reports = await prisma.report.findMany({
    where: statusFilter === "ALL" ? {} : { status: statusFilter as "PENDING" | "RESOLVED" | "DISMISSED" },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      reason: true,
      detail: true,
      status: true,
      createdAt: true,
      postId: true,
      commentId: true,
      reporter: {
        select: { name: true },
      },
      post: {
        select: { id: true, title: true, isHidden: true },
      },
      comment: {
        select: {
          id: true,
          content: true,
          postId: true,
          post: { select: { title: true } },
        },
      },
    },
  });

  const pendingCount = await prisma.report.count({ where: { status: "PENDING" } });

  const STATUS_TABS = [
    { key: "PENDING", label: `대기 (${pendingCount})` },
    { key: "RESOLVED", label: "처리완료" },
    { key: "DISMISSED", label: "반려" },
    { key: "ALL", label: "전체" },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">
        신고 관리
      </h1>

      {/* Status Tabs */}
      <div className="mb-4 flex gap-2">
        {STATUS_TABS.map((tab) => (
          <a
            key={tab.key}
            href={`/admin/reports?status=${tab.key}`}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              statusFilter === tab.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80"
            }`}
          >
            {tab.label}
          </a>
        ))}
      </div>

      {/* Reports List */}
      <Card className="overflow-hidden">
        {reports.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            <p className="text-lg">신고 내역이 없습니다</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {reports.map((report) => {
              const statusInfo = STATUS_LABELS[report.status] || STATUS_LABELS.PENDING;
              const isPost = !!report.postId;
              const targetTitle = isPost
                ? report.post?.title || "삭제된 게시글"
                : report.comment?.content?.substring(0, 80) || "삭제된 댓글";
              const targetLink = isPost
                ? `/community/${report.postId}`
                : `/community/${report.comment?.postId}`;

              return (
                <div key={report.id} className="px-4 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* 상태 + 유형 + 사유 */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${statusInfo.className}`}>
                          {statusInfo.label}
                        </span>
                        <span className="rounded bg-muted px-1.5 py-0.5 text-xs">
                          {isPost ? "게시글" : "댓글"}
                        </span>
                        <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-xs text-red-600 dark:text-red-400">
                          {REASON_LABELS[report.reason]}
                        </span>
                      </div>

                      {/* 대상 */}
                      <a
                        href={targetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 block truncate text-sm font-medium hover:underline"
                      >
                        {targetTitle}
                      </a>

                      {/* 상세 내용 */}
                      {report.detail && (
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                          {report.detail}
                        </p>
                      )}

                      {/* 메타 */}
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>신고자: {report.reporter.name || "익명"}</span>
                        <span>·</span>
                        <span>{formatDateSmart(report.createdAt)}</span>
                      </div>
                    </div>

                    {/* 액션 버튼 */}
                    {report.status === "PENDING" && (
                      <ReportActions
                        reportId={report.id}
                        postId={report.postId}
                        commentId={report.commentId}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
