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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminAdActions } from "./AdminAdActions";

const STATUS_LABELS: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  ACTIVE: { label: "게재중", variant: "default" },
  PENDING_DEPOSIT: { label: "입금대기", variant: "secondary" },
  PENDING_REVIEW: { label: "검토중", variant: "secondary" },
  EXPIRED: { label: "만료", variant: "outline" },
  CANCELLED: { label: "취소", variant: "destructive" },
  REJECTED: { label: "반려", variant: "destructive" },
  DRAFT: { label: "임시저장", variant: "outline" },
  PENDING_PAYMENT: { label: "결제대기", variant: "secondary" },
  PAUSED: { label: "일시정지", variant: "outline" },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminAdDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const { id } = await params;

  const ad = await prisma.ad.findUnique({
    where: { id },
    include: {
      user: { select: { email: true, name: true } },
      payments: true,
    },
  });

  if (!ad) {
    notFound();
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
    const statusInfo = STATUS_LABELS[status] || {
      label: status,
      variant: "outline" as const,
    };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/ads">
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              광고 목록으로
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">{ad.title}</h1>
          <p className="text-muted-foreground mt-1">{ad.businessName}</p>
        </div>
        {ad.status === "PENDING_REVIEW" && (
          <AdminAdActions adId={ad.id} />
        )}
      </div>

      {/* Status and Product */}
      <Card>
        <CardHeader>
          <CardTitle>광고 정보</CardTitle>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                광고주 이메일
              </dt>
              <dd className="text-lg font-semibold">{ad.user.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                총 결제금액
              </dt>
              <dd className="text-lg font-semibold">
                {ad.totalAmount.toLocaleString()}원
              </dd>
            </div>
          </div>
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
                {ad.startDate
                  ? new Date(ad.startDate).toLocaleDateString("ko-KR")
                  : "-"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                종료일
              </dt>
              <dd className="text-lg font-semibold">
                {ad.endDate
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
