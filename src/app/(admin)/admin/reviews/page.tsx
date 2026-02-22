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
import Link from "next/link";
import { Star } from "lucide-react";

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

const ITEMS_PER_PAGE = 20;

export default async function AdminReviewsPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const params = await searchParams;
  const currentPage = parseInt(params.page || "1", 10);

  const totalReviews = await prisma.review.count();

  const reviews = await prisma.review.findMany({
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
  });

  const totalPages = Math.ceil(totalReviews / ITEMS_PER_PAGE);

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">전체 리뷰</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReviews}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">숨겨진 리뷰</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reviews.filter((r) => r.isHidden).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">평균 평점</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reviews.length > 0
                ? (
                    reviews.reduce((sum, r) => sum + r.rating, 0) /
                    reviews.length
                  ).toFixed(1)
                : "0.0"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reviews table */}
      <Card>
        <CardHeader>
          <CardTitle>리뷰 목록</CardTitle>
          <CardDescription>
            {totalReviews}개의 리뷰 (페이지 {currentPage}/{totalPages})
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
                <TableHead>상태</TableHead>
                <TableHead>작성일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((review) => (
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
                    <Badge variant={review.isHidden ? "secondary" : "default"}>
                      {review.isHidden ? "숨김" : "공개"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(review.createdAt).toLocaleDateString("ko-KR")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {currentPage > 1 && (
                <Link href={`/admin/reviews?page=${currentPage - 1}`}>
                  <Badge variant="outline">이전</Badge>
                </Link>
              )}
              <span className="text-sm text-muted-foreground">
                {currentPage} / {totalPages}
              </span>
              {currentPage < totalPages && (
                <Link href={`/admin/reviews?page=${currentPage + 1}`}>
                  <Badge variant="outline">다음</Badge>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
