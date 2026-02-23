import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const notice = await prisma.notice.findUnique({
    where: { id },
    select: { title: true, content: true },
  });

  if (!notice) {
    return { title: "공지사항" };
  }

  const description = notice.content.slice(0, 160).replace(/\n/g, " ");

  return {
    title: notice.title,
    description,
    openGraph: {
      title: `${notice.title} | 여시잡`,
      description,
    },
    alternates: {
      canonical: `/notice/${id}`,
    },
  };
}

export default async function NoticeDetailPage({ params }: PageProps) {
  const { id } = await params;

  const notice = await prisma.notice.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      content: true,
      viewCount: true,
      isPinned: true,
      createdAt: true,
      author: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!notice) {
    redirect("/notice");
  }

  // Increment view count
  await prisma.notice.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  });

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8">
      <Card className="p-6">
        {/* Header */}
        <div className="border-b pb-4">
          <div className="flex items-center gap-2">
            {notice.isPinned && (
              <Badge variant="default" className="text-xs">
                고정
              </Badge>
            )}
            <h1 className="text-2xl font-bold">{notice.title}</h1>
          </div>
          <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
            <span>작성일: {notice.createdAt.toLocaleDateString("ko-KR")}</span>
            <span>조회수: {(notice.viewCount + 1).toLocaleString()}</span>
          </div>
        </div>

        {/* Content */}
        <div className="py-8">
          <div className="prose max-w-none whitespace-pre-wrap">{notice.content}</div>
        </div>

        {/* Footer */}
        <div className="border-t pt-4">
          <Link href="/notice">
            <Button variant="outline">목록으로</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
