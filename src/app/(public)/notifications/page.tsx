import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { MarkAllReadButton } from "@/components/notification/MarkAllReadButton";

export const metadata = {
  title: "알림",
};

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "방금 전";
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  return `${diffDays}일 전`;
}

export default async function NotificationsPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">알림</h1>
        {hasUnread && <MarkAllReadButton />}
      </div>

      {notifications.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">알림이 없습니다</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const CardContent = (
              <Card
                className={`p-4 transition-colors hover:bg-accent ${
                  !notification.isRead ? "border-l-4 border-l-primary bg-primary/5" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-medium">{notification.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                  </div>
                  <time className="text-xs text-muted-foreground whitespace-nowrap">
                    {getTimeAgo(notification.createdAt)}
                  </time>
                </div>
              </Card>
            );

            return notification.link ? (
              <Link key={notification.id} href={notification.link}>
                {CardContent}
              </Link>
            ) : (
              <div key={notification.id}>{CardContent}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
