import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { Star } from "lucide-react";
import { AdminReviewActions } from "@/components/admin/AdminReviewActions";
import { AdminPartnerReviewActions } from "@/components/admin/AdminPartnerReviewActions";

interface PageProps {
  searchParams: Promise<{ page?: string; ppage?: string; tab?: string }>;
}

const ITEMS_PER_PAGE = 20;

export default async function AdminReviewsPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const params = await searchParams;
  const currentPage = parseInt(params.page || "1", 10);
  const partnerPage = parseInt(params.ppage || "1", 10);
  const activeTab = params.tab || "ad";

  // Ad reviews
  const [totalAdReviews, adReviews] = await Promise.all([
    prisma.review.count(),
    prisma.review.findMany({
      include: {
        ad: {
          select: {
            title: true,
            businessName: true,
          },
        },
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
    }),
  ]);

  // Partner reviews
  const [totalPartnerReviews, partnerReviews] = await Promise.all([
    prisma.partnerReview.count(),
    prisma.partnerReview.findMany({
      include: {
        partner: {
          select: {
            name: true,
            category: true,
          },
        },
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (partnerPage - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
    }),
  ]);

  const totalAdPages = Math.ceil(totalAdReviews / ITEMS_PER_PAGE);
  const totalPartnerPages = Math.ceil(totalPartnerReviews / ITEMS_PER_PAGE);

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">리뷰 관리</h1>
        <p className="text-muted-foreground mt-1">
          전체 리뷰 목록 및 관리
        </p>
      </div>

      {/* Review stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">광고 후기</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAdReviews}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">제휴업체 후기</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPartnerReviews}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">전체 리뷰</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAdReviews + totalPartnerReviews}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">광고 평균 평점</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {adReviews.length > 0
                ? (
                    adReviews.reduce((sum, r) => sum + r.rating, 0) /
                    adReviews.length
                  ).toFixed(1)
                : "0.0"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue={activeTab}>
        <TabsList>
          <TabsTrigger value="ad">광고 후기 ({totalAdReviews})</TabsTrigger>
          <TabsTrigger value="partner">제휴업체 후기 ({totalPartnerReviews})</TabsTrigger>
        </TabsList>

        {/* 광고 후기 탭 */}
        <TabsContent value="ad">
          <Card>
            <CardHeader>
              <CardTitle>광고 후기 목록</CardTitle>
              <CardDescription>
                {totalAdReviews}개의 리뷰 (페이지 {currentPage}/{totalAdPages || 1})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>공고 제목</TableHead>
                    <TableHead>사업자명</TableHead>
                    <TableHead>작성자</TableHead>
                    <TableHead>평점</TableHead>
                    <TableHead>내용</TableHead>
                    <TableHead>작성일</TableHead>
                    <TableHead>관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adReviews.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell className="font-medium">
                        {review.ad.title}
                      </TableCell>
                      <TableCell>{review.ad.businessName}</TableCell>
                      <TableCell>
                        {review.user.name}
                        <br />
                        <span className="text-xs text-muted-foreground">
                          {review.user.email}
                        </span>
                      </TableCell>
                      <TableCell>{renderStars(review.rating)}</TableCell>
                      <TableCell className="max-w-xs">
                        {truncateText(review.content, 100)}
                      </TableCell>
                      <TableCell>
                        {new Date(review.createdAt).toLocaleDateString("ko-KR")}
                      </TableCell>
                      <TableCell>
                        <AdminReviewActions
                          reviewId={review.id}
                          isHidden={review.isHidden}
                          content={review.content}
                          rating={review.rating}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalAdPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  {currentPage > 1 && (
                    <Link href={`/admin/reviews?page=${currentPage - 1}&tab=ad`}>
                      <Badge variant="outline">이전</Badge>
                    </Link>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {currentPage} / {totalAdPages}
                  </span>
                  {currentPage < totalAdPages && (
                    <Link href={`/admin/reviews?page=${currentPage + 1}&tab=ad`}>
                      <Badge variant="outline">다음</Badge>
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 제휴업체 후기 탭 */}
        <TabsContent value="partner">
          <Card>
            <CardHeader>
              <CardTitle>제휴업체 후기 목록</CardTitle>
              <CardDescription>
                {totalPartnerReviews}개의 리뷰 (페이지 {partnerPage}/{totalPartnerPages || 1})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>업체명</TableHead>
                    <TableHead>카테고리</TableHead>
                    <TableHead>작성자</TableHead>
                    <TableHead>평점</TableHead>
                    <TableHead>내용</TableHead>
                    <TableHead>작성일</TableHead>
                    <TableHead>관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partnerReviews.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell className="font-medium">
                        {review.partner.name}
                      </TableCell>
                      <TableCell>{review.partner.category}</TableCell>
                      <TableCell>
                        {review.user.name}
                        <br />
                        <span className="text-xs text-muted-foreground">
                          {review.user.email}
                        </span>
                      </TableCell>
                      <TableCell>{renderStars(review.rating)}</TableCell>
                      <TableCell className="max-w-xs">
                        {truncateText(review.content, 100)}
                      </TableCell>
                      <TableCell>
                        {new Date(review.createdAt).toLocaleDateString("ko-KR")}
                      </TableCell>
                      <TableCell>
                        <AdminPartnerReviewActions
                          reviewId={review.id}
                          isHidden={review.isHidden}
                          content={review.content}
                          rating={review.rating}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPartnerPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  {partnerPage > 1 && (
                    <Link href={`/admin/reviews?ppage=${partnerPage - 1}&tab=partner`}>
                      <Badge variant="outline">이전</Badge>
                    </Link>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {partnerPage} / {totalPartnerPages}
                  </span>
                  {partnerPage < totalPartnerPages && (
                    <Link href={`/admin/reviews?ppage=${partnerPage + 1}&tab=partner`}>
                      <Badge variant="outline">다음</Badge>
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
