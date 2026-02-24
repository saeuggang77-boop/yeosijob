import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";

export default async function AdminSettingsPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  // Test DB connection
  let dbConnected = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbConnected = true;
  } catch {
    dbConnected = false;
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">사이트 설정</h1>
        <p className="text-muted-foreground mt-1">
          시스템 설정 및 상태 확인
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Site Information */}
        <Card>
          <CardHeader>
            <CardTitle>사이트 정보</CardTitle>
            <CardDescription>기본 사이트 설정</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                사이트명
              </dt>
              <dd className="text-lg font-semibold">여시잡</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                운영 상태
              </dt>
              <dd className="mt-1">
                <Badge variant="default" className="flex items-center gap-1 w-fit">
                  <CheckCircle2 className="w-4 h-4" />
                  정상
                </Badge>
              </dd>
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle>시스템 상태</CardTitle>
            <CardDescription>시스템 연결 상태</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                데이터베이스 연결
              </dt>
              <dd className="mt-1">
                <Badge
                  variant={dbConnected ? "default" : "destructive"}
                  className="flex items-center gap-1 w-fit"
                >
                  {dbConnected ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      연결됨
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      연결 실패
                    </>
                  )}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                환경
              </dt>
              <dd className="text-lg font-semibold">
                {process.env.NODE_ENV === "production" ? "프로덕션" : "개발"}
              </dd>
            </div>
          </CardContent>
        </Card>

        {/* Admin Info */}
        <Card>
          <CardHeader>
            <CardTitle>관리자 정보</CardTitle>
            <CardDescription>현재 로그인한 관리자</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                이름
              </dt>
              <dd className="text-lg font-semibold">{session.user.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                이메일
              </dt>
              <dd className="text-lg font-semibold">{session.user.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                권한
              </dt>
              <dd className="mt-1">
                <Badge variant="default">관리자</Badge>
              </dd>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>빠른 통계</CardTitle>
            <CardDescription>주요 지표 요약</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              자세한 통계는 대시보드에서 확인하세요.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
