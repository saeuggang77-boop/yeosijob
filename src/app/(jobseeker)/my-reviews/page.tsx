import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils/format";
import { DeleteReviewButton } from "./DeleteReviewButton";

export default async function MyReviewsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "JOBSEEKER") {
    redirect("/");
  }

  const reviews = await prisma.review.findMany({
    where: { userId: session.user.id },
    include: {
      ad: {
        select: {
          id: true,
          title: true,
          businessName: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-screen-lg px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">내가 쓴 후기 ({reviews.length}건)</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          작성한 후기를 확인하고 관리할 수 있습니다
        </p>
      </div>

      {reviews.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="mb-4 text-muted-foreground">
              작성한 후기가 없습니다
            </p>
            <Link href="/" className="text-sm text-primary hover:underline">
              채용정보 둘러보기
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const stars = Array.from({ length: 5 }, (_, i) => i < review.rating);

            return (
              <Card key={review.id}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <Link
                          href={`/jobs/${review.ad.id}`}
                          className="font-semibold hover:underline"
                        >
                          {review.ad.businessName}
                        </Link>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {review.ad.title}
                        </p>
                      </div>
                      <DeleteReviewButton reviewId={review.id} />
                    </div>

                    <div className="flex items-center gap-1">
                      {stars.map((filled, i) => (
                        <span
                          key={i}
                          className={
                            filled
                              ? "text-yellow-500"
                              : "text-muted-foreground"
                          }
                        >
                          {filled ? "★" : "☆"}
                        </span>
                      ))}
                    </div>

                    <p className="text-sm">{review.content}</p>

                    <p className="text-xs text-muted-foreground">
                      작성일: {formatDate(review.createdAt)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 하단 여백 (모바일 네비) */}
      <div className="h-20 md:hidden" />
    </div>
  );
}
