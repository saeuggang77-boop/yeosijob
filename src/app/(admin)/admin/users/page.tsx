import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import type { UserRole } from "@/generated/prisma/client";
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

interface PageProps {
  searchParams: Promise<{ role?: UserRole; page?: string }>;
}

const ITEMS_PER_PAGE = 20;

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const params = await searchParams;
  const roleFilter = params.role;
  const currentPage = parseInt(params.page || "1", 10);

  // Count users by role
  const [totalUsers, jobseekerCount, businessCount, adminCount] =
    await Promise.all([
      prisma.user.count(roleFilter ? { where: { role: roleFilter } } : undefined),
      prisma.user.count({ where: { role: "JOBSEEKER" } }),
      prisma.user.count({ where: { role: "BUSINESS" } }),
      prisma.user.count({ where: { role: "ADMIN" } }),
    ]);

  // Fetch users
  const users = await prisma.user.findMany({
    where: roleFilter ? { role: roleFilter } : {},
    orderBy: { createdAt: "desc" },
    skip: (currentPage - 1) * ITEMS_PER_PAGE,
    take: ITEMS_PER_PAGE,
  });

  const totalPages = Math.ceil(totalUsers / ITEMS_PER_PAGE);

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case "ADMIN":
        return "default";
      case "BUSINESS":
        return "secondary";
      case "JOBSEEKER":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">사용자 관리</h1>
        <p className="text-muted-foreground mt-1">
          전체 사용자 목록 및 관리
        </p>
      </div>

      {/* User counts */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">전체 사용자</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">구직자</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobseekerCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">사업자</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{businessCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">관리자</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>필터</CardTitle>
          <CardDescription>사용자 유형별로 필터링</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Link href="/admin/users">
              <Badge variant={!roleFilter ? "default" : "outline"}>전체</Badge>
            </Link>
            <Link href="/admin/users?role=JOBSEEKER">
              <Badge variant={roleFilter === "JOBSEEKER" ? "default" : "outline"}>
                구직자
              </Badge>
            </Link>
            <Link href="/admin/users?role=BUSINESS">
              <Badge variant={roleFilter === "BUSINESS" ? "default" : "outline"}>
                사업자
              </Badge>
            </Link>
            <Link href="/admin/users?role=ADMIN">
              <Badge variant={roleFilter === "ADMIN" ? "default" : "outline"}>
                관리자
              </Badge>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Users table */}
      <Card>
        <CardHeader>
          <CardTitle>사용자 목록</CardTitle>
          <CardDescription>
            {totalUsers}명의 사용자 (페이지 {currentPage}/{totalPages})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이름</TableHead>
                <TableHead>이메일</TableHead>
                <TableHead>전화번호</TableHead>
                <TableHead>역할</TableHead>
                <TableHead>사업자명</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>가입일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.phone || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {user.role === "ADMIN"
                        ? "관리자"
                        : user.role === "BUSINESS"
                        ? "사업자"
                        : "구직자"}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.businessName || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? "default" : "secondary"}>
                      {user.isActive ? "활성" : "비활성"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString("ko-KR")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {currentPage > 1 && (
                <Link
                  href={`/admin/users?${new URLSearchParams({
                    ...(roleFilter && { role: roleFilter }),
                    page: String(currentPage - 1),
                  })}`}
                >
                  <Badge variant="outline">이전</Badge>
                </Link>
              )}
              <span className="text-sm text-muted-foreground">
                {currentPage} / {totalPages}
              </span>
              {currentPage < totalPages && (
                <Link
                  href={`/admin/users?${new URLSearchParams({
                    ...(roleFilter && { role: roleFilter }),
                    page: String(currentPage + 1),
                  })}`}
                >
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
