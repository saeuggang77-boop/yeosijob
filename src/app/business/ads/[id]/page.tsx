import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import type { Region } from "@/generated/prisma/client";
import { REGIONS } from "@/lib/constants/regions";
import { BUSINESS_TYPES } from "@/lib/constants/business-types";
import { AD_PRODUCTS } from "@/lib/constants/products";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Edit, BarChart3 } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session || session.user.role !== "BUSINESS") {
    redirect("/login");
  }

  const { id } = await params;

  const ad = await prisma.ad.findUnique({
    where: { id },
  });

  if (!ad) {
    notFound();
  }

  // Verify ownership
  if (ad.userId !== session.user.id) {
    redirect("/business/dashboard");
  }

  const getRegionNames = (regions: Region[]) => {
    return regions
      .map((region) => {
        const key = region as keyof typeof REGIONS;
        return REGIONS[key]?.label;
      })
      .filter(Boolean)
      .join(", ");
  };

  const getBusinessTypeName = (type: string) => {
    const key = type as keyof typeof BUSINESS_TYPES;
    return BUSINESS_TYPES[key]?.label || type;
  };

  const getProductName = (productId: string) => {
    return AD_PRODUCTS[productId]?.name || productId;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge variant="default">활성</Badge>;
      case "PENDING":
        return <Badge variant="secondary">대기중</Badge>;
      case "EXPIRED":
        return <Badge variant="outline">만료</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const isFree = ad.productId === "FREE";

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/business/dashboard">
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              대시보드로 돌아가기
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">{ad.title}</h1>
          <p className="text-muted-foreground mt-1">{ad.businessName}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/business/ads/${id}/edit`}>
            <Button variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              {isFree ? "수정 (무제한)" : "수정"}
            </Button>
          </Link>
          <Link href={`/business/ads/${id}/stats`}>
            <Button variant="outline">
              <BarChart3 className="w-4 h-4 mr-2" />
              통계
            </Button>
          </Link>
        </div>
      </div>

      {/* 업그레이드 안내 - BANNER가 아닌 ACTIVE 광고 */}
      {ad.status === "ACTIVE" && ad.productId !== "BANNER" && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle>{isFree ? "무료 광고 등급" : `현재 등급: ${getProductName(ad.productId)}`}</CardTitle>
            <CardDescription>
              {isFree
                ? "유료 등급으로 업그레이드하면 자동점프, 수동점프, 이력서 열람 기능을 사용할 수 있습니다."
                : "상위 등급으로 업그레이드하면 더 많은 노출과 기능을 이용할 수 있습니다."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isFree && (
              <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                <li>• 수동점프는 유료 등급부터 사용할 수 있습니다</li>
                <li>• 이력서 열람은 유료 등급부터 가능합니다</li>
                <li>• 무료 광고는 리스트 최하단에 노출됩니다</li>
              </ul>
            )}
            <Link href={`/business/ads/${id}/upgrade`}>
              <Button>{isFree ? "유료 광고로 업그레이드" : "상위 등급으로 업그레이드"}</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* 연장 안내 - EXPIRED 유료 광고 */}
      {ad.status === "EXPIRED" && ad.productId !== "FREE" && (
        <Card className="border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
          <CardHeader>
            <CardTitle>광고가 만료되었습니다</CardTitle>
            <CardDescription>
              동일한 상품({getProductName(ad.productId)})으로 광고를 연장할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/business/ads/${id}/renew`}>
              <Button>광고 연장하기</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Status and Product */}
      <Card>
        <CardHeader>
          <CardTitle>공고 상태</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                상태
              </dt>
              <dd className="mt-1">{getStatusBadge(ad.status)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                상품
              </dt>
              <dd className="text-lg font-semibold">
                {getProductName(ad.productId)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                조회수
              </dt>
              <dd className="text-lg font-semibold">{ad.viewCount}</dd>
            </div>
          </div>
          {isFree && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  광고 금액
                </dt>
                <dd className="text-lg font-semibold">무료</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  광고 기간
                </dt>
                <dd className="text-lg font-semibold">무제한</dd>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <dt className="text-sm font-medium text-muted-foreground">
              업종
            </dt>
            <dd className="text-lg font-semibold">
              {getBusinessTypeName(ad.businessType)}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">
              근무 지역
            </dt>
            <dd className="text-lg font-semibold">
              {getRegionNames(ad.regions)}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">
              급여
            </dt>
            <dd className="text-lg font-semibold">{ad.salaryText}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">
              근무 시간
            </dt>
            <dd className="text-lg font-semibold">{ad.workHours}</dd>
          </div>
          {ad.benefits && (
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                복지 혜택
              </dt>
              <dd className="text-lg font-semibold whitespace-pre-wrap">
                {ad.benefits}
              </dd>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle>상세 설명</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap">{ad.description}</p>
        </CardContent>
      </Card>

      {/* Work Environment */}
      {ad.workEnvironment && (
        <Card>
          <CardHeader>
            <CardTitle>근무환경</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{ad.workEnvironment}</p>
          </CardContent>
        </Card>
      )}

      {/* Safety Info */}
      {ad.safetyInfo && (
        <Card>
          <CardHeader>
            <CardTitle>안전 / 보안 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{ad.safetyInfo}</p>
          </CardContent>
        </Card>
      )}

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>연락처</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <dt className="text-sm font-medium text-muted-foreground">
              전화번호
            </dt>
            <dd className="text-lg font-semibold">{ad.contactPhone}</dd>
          </div>
          {ad.contactKakao && (
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                카카오톡 ID
              </dt>
              <dd className="text-lg font-semibold">{ad.contactKakao}</dd>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dates */}
      <Card>
        <CardHeader>
          <CardTitle>기간 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                등록일
              </dt>
              <dd className="text-lg font-semibold">
                {new Date(ad.createdAt).toLocaleDateString("ko-KR")}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                시작일
              </dt>
              <dd className="text-lg font-semibold">
                {isFree ? "무제한" : ad.startDate
                  ? new Date(ad.startDate).toLocaleDateString("ko-KR")
                  : "-"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                종료일
              </dt>
              <dd className="text-lg font-semibold">
                {isFree ? "무제한" : ad.endDate
                  ? new Date(ad.endDate).toLocaleDateString("ko-KR")
                  : "-"}
              </dd>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
