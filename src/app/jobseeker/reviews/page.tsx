import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils/format";
import { DeleteReviewButton } from "./DeleteReviewButton";
import { DeletePartnerReviewButton } from "@/components/reviews/DeletePartnerReviewButton";

export default async function MyReviewsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "JOBSEEKER") {
    redirect("/");
  }

  const [reviews, partnerReviews] = await Promise.all([
    prisma.review.findMany({
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
    }),
    prisma.partnerReview.findMany({
      where: { userId: session.user.id },
      include: {
        partner: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const totalCount = reviews.length + partnerReviews.length;

  return (
    <div className="mx-auto max-w-screen-lg px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">내가 쓴 후기 ({totalCount}건)</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          작성한 후기를 확인하고 관리할 수 있습니다
        </p>
      </div>

      <Tabs defaultValue="work">
        <TabsList className="mb-4">
          <TabsTrigger value="work">근무 후기 ({reviews.length})</TabsTrigger>
          <TabsTrigger value="partner">이용 후기 ({partnerReviews.length})</TabsTrigger>
        </TabsList>

        {/* 근무 후기 탭 */}
        <TabsContent value="work">
          {reviews.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="mb-4 text-muted-foreground">
                  작성한 근무 후기가 없습니다
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
                            {review.ad ? (
                              <>
                                <Link
                                  href={`/jobs/${review.ad.id}`}
                                  className="font-semibold hover:underline"
                                >
                                  {review.ad.businessName}
                                </Link>
                                <p className="mt-1 text-sm text-muted-foreground">
                                  {review.ad.title}
                                </p>
                              </>
                            ) : (
                              <>
                                <span className="font-semibold text-muted-foreground">
                                  삭제된 광고
                                </span>
                                <p className="mt-1 text-sm text-muted-foreground">
                                  광고가 삭제되었습니다
                                </p>
                              </>
                            )}
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
        </TabsContent>

        {/* 이용 후기 탭 */}
        <TabsContent value="partner">
          {partnerReviews.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="mb-4 text-muted-foreground">
                  작성한 이용 후기가 없습니다
                </p>
                <Link href="/partner" className="text-sm text-primary hover:underline">
                  제휴업체 둘러보기
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {partnerReviews.map((review) => {
                const stars = Array.from({ length: 5 }, (_, i) => i < review.rating);

                return (
                  <Card key={review.id}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            {review.partner ? (
                              <>
                                <Link
                                  href={`/partner/${review.partner.id}`}
                                  className="font-semibold hover:underline"
                                >
                                  {review.partner.name}
                                </Link>
                                <p className="mt-1 text-sm text-muted-foreground">
                                  제휴업체
                                </p>
                              </>
                            ) : (
                              <>
                                <span className="font-semibold text-muted-foreground">
                                  삭제된 업체
                                </span>
                                <p className="mt-1 text-sm text-muted-foreground">
                                  업체가 삭제되었습니다
                                </p>
                              </>
                            )}
                          </div>
                          <DeletePartnerReviewButton reviewId={review.id} />
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
        </TabsContent>
      </Tabs>

      {/* 하단 여백 (모바일 네비) */}
      <div className="h-20 md:hidden" />
    </div>
  );
}
