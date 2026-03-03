"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface EventConfig {
  id: string;
  enabled: boolean;
  eventName: string;
  startDate: string | null;
  endDate: string | null;
  bonus30: number;
  bonus60: number;
  bonus90: number;
  targetNewOnly: boolean;
  updatedAt: string;
}

export default function EventManagementPage() {
  const [config, setConfig] = useState<EventConfig | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [eventName, setEventName] = useState("기간 추가 이벤트");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [bonus30, setBonus30] = useState(10);
  const [bonus60, setBonus60] = useState(30);
  const [bonus90, setBonus90] = useState(60);
  const [targetNewOnly, setTargetNewOnly] = useState(true);
  const [loading, setLoading] = useState(false);
  const [dDay, setDDay] = useState<number | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  useEffect(() => {
    if (endDate) {
      const end = new Date(endDate);
      const now = new Date();
      const diffMs = end.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      setDDay(diffDays);
    } else {
      setDDay(null);
    }
  }, [endDate]);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/admin/events");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setConfig(data);
      setEnabled(data.enabled);
      setEventName(data.eventName);
      setStartDate(data.startDate ? data.startDate.split("T")[0] : "");
      setEndDate(data.endDate ? data.endDate.split("T")[0] : "");
      setBonus30(data.bonus30);
      setBonus60(data.bonus60);
      setBonus90(data.bonus90);
      setTargetNewOnly(data.targetNewOnly);
    } catch (error) {
      console.error("Config fetch error:", error);
      alert("설정을 불러올 수 없습니다");
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled,
          eventName,
          startDate: startDate || null,
          endDate: endDate || null,
          bonus30,
          bonus60,
          bonus90,
          targetNewOnly,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");

      const data = await res.json();
      setConfig(data);
      alert("저장되었습니다");
    } catch (error) {
      console.error("Save error:", error);
      alert("저장에 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-screen-xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">이벤트 관리</h1>
          <p className="text-sm text-muted-foreground mt-1">
            광고 등록 시 추가 기간을 제공하는 이벤트를 관리합니다
          </p>
        </div>
        <Badge variant={enabled ? "default" : "secondary"}>
          {enabled ? "활성" : "비활성"}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>이벤트 설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 이벤트 ON/OFF */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">이벤트 활성화</label>
              <p className="text-xs text-muted-foreground">
                이벤트를 켜면 광고 등록 시 보너스 기간이 자동으로 추가됩니다
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              onClick={() => setEnabled(!enabled)}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                enabled ? "bg-primary" : "bg-muted-foreground/30"
              }`}
            >
              <span
                className={`inline-block size-[22px] rounded-full bg-white shadow transition-transform ${
                  enabled ? "translate-x-[22px]" : "translate-x-[3px]"
                }`}
              />
            </button>
          </div>

          {/* 이벤트 이름 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">이벤트 이름</label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="기간 추가 이벤트"
            />
          </div>

          {/* 기간 설정 */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">시작일</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">종료일</label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                {dDay !== null && (
                  <Badge variant={dDay > 0 ? "default" : "destructive"}>
                    D{dDay > 0 ? `-${dDay}` : "-Day"}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* 보너스 설정 */}
          <div className="space-y-4">
            <label className="text-sm font-medium">보너스 기간 설정 (일)</label>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">30일 결제</label>
                <input
                  type="number"
                  value={bonus30}
                  onChange={(e) => setBonus30(Number(e.target.value))}
                  min="0"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  총 {30 + bonus30}일 노출
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">60일 결제</label>
                <input
                  type="number"
                  value={bonus60}
                  onChange={(e) => setBonus60(Number(e.target.value))}
                  min="0"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  총 {60 + bonus60}일 노출
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">90일 결제</label>
                <input
                  type="number"
                  value={bonus90}
                  onChange={(e) => setBonus90(Number(e.target.value))}
                  min="0"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  총 {90 + bonus90}일 노출
                </p>
              </div>
            </div>
          </div>

          {/* 신규 회원 전용 */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">신규 회원 전용</label>
              <p className="text-xs text-muted-foreground">
                첫 광고 등록 회원에게만 보너스를 제공합니다
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={targetNewOnly}
              onClick={() => setTargetNewOnly(!targetNewOnly)}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                targetNewOnly ? "bg-primary" : "bg-muted-foreground/30"
              }`}
            >
              <span
                className={`inline-block size-[22px] rounded-full bg-white shadow transition-transform ${
                  targetNewOnly ? "translate-x-[22px]" : "translate-x-[3px]"
                }`}
              />
            </button>
          </div>

          {/* 저장 버튼 */}
          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "저장 중..." : "저장"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
