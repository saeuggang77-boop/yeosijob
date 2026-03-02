"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface BannedUser {
  id: string;
  email: string;
  phone: string;
  name: string;
  reason: string;
  bannedAt: string;
  admin: {
    name: string;
  };
}

interface SuspendedUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  suspendedUntil: string | null;
  suspendReason: string | null;
}

export function BannedUsersClient() {
  const [tab, setTab] = useState<"banned" | "suspended">("banned");
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const [suspendedUsers, setSuspendedUsers] = useState<SuspendedUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/banned?tab=${tab}`);
      const data = await res.json();

      if (tab === "banned") {
        setBannedUsers(data.bannedUsers || []);
      } else {
        setSuspendedUsers(data.suspendedUsers || []);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleUnban(id: string) {
    if (!confirm("강퇴를 해제하시겠습니까? 해당 사용자는 재가입이 가능해집니다.")) {
      return;
    }

    try {
      const res = await fetch("/api/admin/banned", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message);
        fetchData();
      } else {
        alert(data.error || "해제에 실패했습니다");
      }
    } catch (error) {
      console.error("Unban error:", error);
      alert("서버 오류가 발생했습니다");
    }
  }

  async function handleUnsuspend(userId: string) {
    if (!confirm("활동정지를 해제하시겠습니까?")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unsuspend" }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message);
        fetchData();
      } else {
        alert(data.error || "해제에 실패했습니다");
      }
    } catch (error) {
      console.error("Unsuspend error:", error);
      alert("서버 오류가 발생했습니다");
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">제재 관리</h1>

      <div className="flex gap-2 mb-6">
        <Button
          variant={tab === "banned" ? "default" : "outline"}
          onClick={() => setTab("banned")}
        >
          강퇴 회원
        </Button>
        <Button
          variant={tab === "suspended" ? "default" : "outline"}
          onClick={() => setTab("suspended")}
        >
          활동정지 회원
        </Button>
      </div>

      {loading ? (
        <p className="text-center py-12 text-muted-foreground">로딩 중...</p>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {tab === "banned" ? "강퇴 회원 목록" : "활동정지 회원 목록"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tab === "banned" ? (
              bannedUsers.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  강퇴된 회원이 없습니다
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-3 font-medium">이름</th>
                        <th className="pb-3 font-medium">이메일</th>
                        <th className="pb-3 font-medium">전화번호</th>
                        <th className="pb-3 font-medium">강퇴 사유</th>
                        <th className="pb-3 font-medium">강퇴일</th>
                        <th className="pb-3 font-medium">처리 관리자</th>
                        <th className="pb-3 font-medium">작업</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {bannedUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-muted/50">
                          <td className="py-3 font-medium">{user.name}</td>
                          <td className="py-3 text-muted-foreground">
                            {user.email}
                          </td>
                          <td className="py-3 text-muted-foreground">
                            {user.phone}
                          </td>
                          <td className="py-3 text-muted-foreground">
                            {user.reason}
                          </td>
                          <td className="py-3 text-muted-foreground">
                            {new Date(user.bannedAt).toLocaleDateString("ko-KR")}
                          </td>
                          <td className="py-3 text-muted-foreground">
                            {user.admin.name}
                          </td>
                          <td className="py-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUnban(user.id)}
                            >
                              해제
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : suspendedUsers.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                활동정지 회원이 없습니다
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-3 font-medium">이름</th>
                      <th className="pb-3 font-medium">이메일</th>
                      <th className="pb-3 font-medium">정지 사유</th>
                      <th className="pb-3 font-medium">만료일</th>
                      <th className="pb-3 font-medium">상태</th>
                      <th className="pb-3 font-medium">작업</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {suspendedUsers.map((user) => {
                      const isIndefinite =
                        user.suspendedUntil &&
                        new Date(user.suspendedUntil).getFullYear() === 9999;
                      const expiryDate = user.suspendedUntil
                        ? new Date(user.suspendedUntil).toLocaleDateString("ko-KR")
                        : "-";

                      return (
                        <tr key={user.id} className="hover:bg-muted/50">
                          <td className="py-3 font-medium">
                            {user.name || "-"}
                          </td>
                          <td className="py-3 text-muted-foreground">
                            {user.email}
                          </td>
                          <td className="py-3 text-muted-foreground">
                            {user.suspendReason || "-"}
                          </td>
                          <td className="py-3 text-muted-foreground">
                            {isIndefinite ? "무기한" : expiryDate}
                          </td>
                          <td className="py-3">
                            <span
                              className={`inline-block rounded px-2 py-1 text-xs font-medium ${
                                isIndefinite
                                  ? "bg-destructive/20 text-destructive"
                                  : "bg-[#D4A853]/20 text-[#D4A853]"
                              }`}
                            >
                              {isIndefinite ? "무기한" : "기간"}
                            </span>
                          </td>
                          <td className="py-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUnsuspend(user.id)}
                            >
                              해제
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
