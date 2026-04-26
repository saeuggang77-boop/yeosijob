import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, Sparkles, ThumbsUp, MessageSquare, FileText, Calendar } from "lucide-react";

export const metadata = {
  title: "내 활동 | 여시잡",
  robots: { index: false, follow: false },
};

const TIERS = [
  { name: "새싹", emoji: "🌱", min: 0, max: 49, color: "text-green-400" },
  { name: "새내기", emoji: "🌿", min: 50, max: 199, color: "text-emerald-400" },
  { name: "활동회원", emoji: "🌸", min: 200, max: 999, color: "text-pink-400" },
  { name: "우수회원", emoji: "🌺", min: 1000, max: 4999, color: "text-rose-400" },
  { name: "베테랑", emoji: "🌳", min: 5000, max: Infinity, color: "text-primary" },
] as const;

function getTier(score: number) {
  return TIERS.find((t) => score >= t.min && score <= t.max) ?? TIERS[0];
}

function getNextTier(score: number) {
  const idx = TIERS.findIndex((t) => score >= t.min && score <= t.max);
  return idx >= 0 && idx < TIERS.length - 1 ? TIERS[idx + 1] : null;
}

export default async function MyActivityPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.id;
  const profilePath =
    session.user.role === "BUSINESS"
      ? "/business/profile"
      : session.user.role === "ADMIN"
        ? "/admin"
        : "/jobseeker/profile";
  const profileLabel = session.user.role === "ADMIN" ? "관리자" : "마이페이지";

  // 누적 통계
  const [user, postCount, commentCount, receivedLikes, monthlyPosts, monthlyComments, topPosts] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true } }),
    prisma.post.count({ where: { authorId: userId, deletedAt: null } }),
    prisma.comment.count({ where: { authorId: userId, deletedAt: null } }),
    prisma.postLike.count({ where: { post: { authorId: userId, deletedAt: null } } }),
    // 최근 6개월 글 수
    prisma.post.findMany({
      where: {
        authorId: userId,
        deletedAt: null,
        createdAt: { gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) },
      },
      select: { createdAt: true },
    }),
    prisma.comment.findMany({
      where: {
        authorId: userId,
        deletedAt: null,
        createdAt: { gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) },
      },
      select: { createdAt: true },
    }),
    prisma.post.findMany({
      where: { authorId: userId, deletedAt: null },
      orderBy: { likes: { _count: "desc" } },
      take: 5,
      select: {
        id: true,
        slug: true,
        title: true,
        createdAt: true,
        _count: { select: { likes: true, comments: { where: { deletedAt: null } } } },
      },
    }),
  ]);

  const daysSinceJoin = user?.createdAt
    ? Math.max(1, Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (24 * 60 * 60 * 1000)))
    : 1;

  // 점수 = 글×5 + 댓글×1 + 받은 좋아요×3
  const score = postCount * 5 + commentCount + receivedLikes * 3;
  const tier = getTier(score);
  const nextTier = getNextTier(score);
  const progressPct = nextTier
    ? Math.min(100, Math.floor(((score - tier.min) / (nextTier.min - tier.min)) * 100))
    : 100;
  const pointsToNext = nextTier ? nextTier.min - score : 0;

  // 월별 집계 (최근 6개월)
  const monthBuckets: { label: string; posts: number; comments: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const y = d.getFullYear();
    const m = d.getMonth();
    const label = `${m + 1}월`;
    const posts = monthlyPosts.filter((p) => {
      const dt = new Date(p.createdAt);
      return dt.getFullYear() === y && dt.getMonth() === m;
    }).length;
    const comments = monthlyComments.filter((c) => {
      const dt = new Date(c.createdAt);
      return dt.getFullYear() === y && dt.getMonth() === m;
    }).length;
    monthBuckets.push({ label, posts, comments });
  }
  const maxMonthly = Math.max(1, ...monthBuckets.map((b) => b.posts + b.comments));

  return (
    <div className="mx-auto max-w-screen-md px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={profilePath}
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          {profileLabel}
        </Link>
        <h1 className="text-2xl font-bold">내 활동</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          이 페이지는 본인만 볼 수 있어요. 다른 사람에게는 표시되지 않습니다.
        </p>
      </div>

      {/* 등급 카드 */}
      <Card className="mb-6 border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5">
        <CardContent className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{tier.emoji}</span>
              <div>
                <div className={`text-lg font-bold ${tier.color}`}>{tier.name}</div>
                <div className="text-xs text-muted-foreground">활동 점수 {score.toLocaleString()}</div>
              </div>
            </div>
            {nextTier && (
              <div className="text-right text-xs text-muted-foreground">
                <div className="text-primary">{nextTier.emoji} {nextTier.name}까지</div>
                <div className="font-bold">{pointsToNext.toLocaleString()}점</div>
              </div>
            )}
          </div>
          {nextTier && (
            <div className="mt-2">
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-gradient-to-r from-primary/70 to-primary transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="mt-1 text-right text-[11px] text-muted-foreground">{progressPct}%</div>
            </div>
          )}
          {!nextTier && (
            <div className="mt-2 rounded bg-primary/10 p-2 text-center text-xs text-primary">
              🎉 최고 등급에 도달하셨어요!
            </div>
          )}
        </CardContent>
      </Card>

      {/* 누적 통계 */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={<FileText className="size-4" />} label="작성한 글" value={postCount} />
        <StatCard icon={<MessageSquare className="size-4" />} label="작성한 댓글" value={commentCount} />
        <StatCard icon={<ThumbsUp className="size-4" />} label="받은 좋아요" value={receivedLikes} />
        <StatCard icon={<Calendar className="size-4" />} label="활동일수" value={daysSinceJoin} suffix="일" />
      </div>

      {/* 월별 활동 */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <span className="text-sm font-bold">월별 활동 (최근 6개월)</span>
          </div>
          <div className="space-y-2">
            {monthBuckets.map((b) => (
              <div key={b.label} className="flex items-center gap-3 text-xs">
                <div className="w-10 shrink-0 text-muted-foreground">{b.label}</div>
                <div className="flex-1">
                  <div className="flex h-5 items-center gap-0.5 rounded-sm bg-muted/50">
                    {b.posts > 0 && (
                      <div
                        className="h-full rounded-l-sm bg-primary"
                        style={{ width: `${(b.posts / maxMonthly) * 100}%` }}
                      />
                    )}
                    {b.comments > 0 && (
                      <div
                        className="h-full bg-primary/40"
                        style={{ width: `${(b.comments / maxMonthly) * 100}%` }}
                      />
                    )}
                  </div>
                </div>
                <div className="w-24 shrink-0 text-right text-muted-foreground">
                  글 {b.posts} · 댓글 {b.comments}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-end gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-3 rounded-sm bg-primary" />글
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-3 rounded-sm bg-primary/40" />댓글
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 받은 좋아요 TOP 5 */}
      {topPosts.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <ThumbsUp className="size-4 text-primary" />
              <span className="text-sm font-bold">좋아요 많이 받은 내 글 TOP 5</span>
            </div>
            <div className="divide-y divide-border">
              {topPosts.map((p, i) => (
                <Link
                  key={p.id}
                  href={`/community/${p.slug || p.id}`}
                  className="flex items-center justify-between gap-3 py-2.5 text-sm hover:text-primary"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="w-5 shrink-0 text-xs font-bold text-primary">#{i + 1}</span>
                    <span className="truncate">{p.title}</span>
                  </div>
                  <div className="shrink-0 text-xs text-muted-foreground">
                    👍 {p._count.likes} · 💬 {p._count.comments}
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 격려 문구 */}
      <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4 text-center text-sm text-muted-foreground">
        꾸준히 활동하시면 베테랑 회원이 될 수 있어요. 💪
      </div>

      {/* 모바일 하단 여백 */}
      <div className="h-20 md:hidden" />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  suffix,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
}) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="mb-1 flex items-center gap-1.5 text-muted-foreground">
          {icon}
          <span className="text-[11px]">{label}</span>
        </div>
        <div className="text-xl font-bold">
          {value.toLocaleString()}
          {suffix && <span className="ml-0.5 text-xs font-normal text-muted-foreground">{suffix}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
