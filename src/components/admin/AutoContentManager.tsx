"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, AlertTriangle } from "lucide-react";

interface Config {
  enabled: boolean;
  postsPerDay: number;
  commentsPerDay: number;
  repliesPerDay: number;
  activeStartHour: number;
  activeEndHour: number;
  realPostAutoReply: boolean;
}

interface PoolStat {
  type: "POST" | "COMMENT" | "REPLY";
  total: number;
  used: number;
  remaining: number;
}

interface GhostStat {
  personality: string;
  count: number;
}

interface Stats {
  poolStats: PoolStat[];
  ghostStats: GhostStat[];
  totalGhostUsers: number;
  todayActivity: {
    posts: number;
    comments: number;
    replies: number;
  };
}

const TYPE_LABELS = {
  POST: "게시글",
  COMMENT: "댓글",
  REPLY: "답글",
};

const PERSONALITY_LABELS: Record<string, string> = {
  CHATTY: "수다쟁이",
  ADVISOR: "조언자",
  QUESTIONER: "질문형",
  EMOJI_LOVER: "이모지러버",
  CALM: "차분형",
  SASSY: "당돌형",
};

export function AutoContentManager({
  initialConfig,
  initialStats,
}: {
  initialConfig: Config;
  initialStats: Stats;
}) {
  const [config, setConfig] = useState<Config>(initialConfig);
  const [stats, setStats] = useState<Stats>(initialStats);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [creatingGhosts, setCreatingGhosts] = useState(false);

  const refreshStats = async () => {
    try {
      const res = await fetch("/api/admin/auto-content/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Stats refresh error:", error);
    }
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/auto-content/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (res.ok) {
        toast.success("설정이 저장되었습니다");
      } else {
        const data = await res.json();
        toast.error(data.error || "설정 저장에 실패했습니다");
      }
    } catch (error) {
      toast.error("설정 저장 중 오류가 발생했습니다");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate = async (type: "POST" | "COMMENT" | "REPLY") => {
    setGenerating(type);
    try {
      const res = await fetch("/api/admin/auto-content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, count: 30 }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(data.message);
        await refreshStats();
      } else {
        const data = await res.json();
        toast.error(data.error || "생성에 실패했습니다");
      }
    } catch (error) {
      toast.error("생성 중 오류가 발생했습니다");
    } finally {
      setGenerating(null);
    }
  };

  const handleCreateGhosts = async () => {
    setCreatingGhosts(true);
    try {
      const res = await fetch("/api/admin/auto-content/ghost-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 10 }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(data.message);
        await refreshStats();
      } else {
        const data = await res.json();
        toast.error(data.error || "생성에 실패했습니다");
      }
    } catch (error) {
      toast.error("생성 중 오류가 발생했습니다");
    } finally {
      setCreatingGhosts(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Card 1 - 시스템 설정 */}
      <Card className="border-zinc-700 bg-zinc-800">
        <CardHeader>
          <CardTitle className="text-[#D4A853]">시스템 설정</CardTitle>
          <CardDescription>자동 콘텐츠 생성 시스템 제어</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">시스템 활성화</Label>
              <p className="text-sm text-muted-foreground">
                자동 콘텐츠 생성 ON/OFF
              </p>
            </div>
            <Switch
              checked={config.enabled}
              onCheckedChange={(checked) =>
                setConfig({ ...config, enabled: checked })
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>일일 게시글 수</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={config.postsPerDay}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    postsPerDay: parseInt(e.target.value) || 0,
                  })
                }
                className="bg-zinc-900 border-zinc-700"
              />
            </div>
            <div className="space-y-2">
              <Label>일일 댓글 수</Label>
              <Input
                type="number"
                min="0"
                max="200"
                value={config.commentsPerDay}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    commentsPerDay: parseInt(e.target.value) || 0,
                  })
                }
                className="bg-zinc-900 border-zinc-700"
              />
            </div>
            <div className="space-y-2">
              <Label>일일 답글 수</Label>
              <Input
                type="number"
                min="0"
                max="200"
                value={config.repliesPerDay}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    repliesPerDay: parseInt(e.target.value) || 0,
                  })
                }
                className="bg-zinc-900 border-zinc-700"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>활동 시작 시간</Label>
              <Select
                value={String(config.activeStartHour)}
                onValueChange={(value) =>
                  setConfig({ ...config, activeStartHour: parseInt(value) })
                }
              >
                <SelectTrigger className="bg-zinc-900 border-zinc-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => (
                    <SelectItem key={i} value={String(i)}>
                      {i}시
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>활동 종료 시간</Label>
              <Select
                value={String(config.activeEndHour)}
                onValueChange={(value) =>
                  setConfig({ ...config, activeEndHour: parseInt(value) })
                }
              >
                <SelectTrigger className="bg-zinc-900 border-zinc-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => (
                    <SelectItem key={i} value={String(i)}>
                      {i}시
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">
                실제 유저 글 자동 댓글
              </Label>
              <p className="text-sm text-muted-foreground">
                실제 유저가 작성한 글에도 자동 댓글 작성
              </p>
            </div>
            <Switch
              checked={config.realPostAutoReply}
              onCheckedChange={(checked) =>
                setConfig({ ...config, realPostAutoReply: checked })
              }
            />
          </div>

          <Button
            onClick={handleSaveConfig}
            disabled={saving}
            className="w-full sm:w-auto"
          >
            {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
            저장
          </Button>
        </CardContent>
      </Card>

      {/* Card 2 - 콘텐츠 풀 현황 */}
      <Card className="border-zinc-700 bg-zinc-800">
        <CardHeader>
          <CardTitle className="text-[#D4A853]">콘텐츠 풀 현황</CardTitle>
          <CardDescription>AI가 생성한 콘텐츠 재고 관리</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-700 hover:bg-zinc-800">
                <TableHead className="text-muted-foreground">타입</TableHead>
                <TableHead className="text-muted-foreground">총 생성</TableHead>
                <TableHead className="text-muted-foreground">사용됨</TableHead>
                <TableHead className="text-muted-foreground">남은 수</TableHead>
                <TableHead className="text-muted-foreground">액션</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.poolStats.map((stat) => (
                <TableRow key={stat.type} className="border-zinc-700">
                  <TableCell className="font-medium">
                    {TYPE_LABELS[stat.type]}
                  </TableCell>
                  <TableCell>{stat.total}</TableCell>
                  <TableCell>{stat.used}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {stat.remaining}
                      {stat.remaining < 20 && stat.type === "POST" && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="size-3" />
                          부족
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {stat.type === "POST" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleGenerate(stat.type)}
                        disabled={generating === stat.type}
                      >
                        {generating === stat.type && (
                          <Loader2 className="mr-2 size-4 animate-spin" />
                        )}
                        더 생성하기 (30개)
                      </Button>
                    ) : (
                      <Badge variant="secondary">실시간 생성</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Card 3 - 유령회원 현황 */}
      <Card className="border-zinc-700 bg-zinc-800">
        <CardHeader>
          <CardTitle className="text-[#D4A853]">유령회원 현황</CardTitle>
          <CardDescription>
            자동 콘텐츠를 작성하는 가상 회원 (총 {stats.totalGhostUsers}명)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-700 hover:bg-zinc-800">
                <TableHead className="text-muted-foreground">성격 유형</TableHead>
                <TableHead className="text-muted-foreground">회원 수</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.ghostStats.map((stat) => (
                <TableRow key={stat.personality} className="border-zinc-700">
                  <TableCell className="font-medium">
                    {PERSONALITY_LABELS[stat.personality] || stat.personality}
                  </TableCell>
                  <TableCell>{stat.count}명</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Button
            onClick={handleCreateGhosts}
            disabled={creatingGhosts}
            variant="outline"
          >
            {creatingGhosts && (
              <Loader2 className="mr-2 size-4 animate-spin" />
            )}
            추가 생성 (10명)
          </Button>
        </CardContent>
      </Card>

      {/* Card 4 - 오늘의 활동 */}
      <Card className="border-zinc-700 bg-zinc-800">
        <CardHeader>
          <CardTitle className="text-[#D4A853]">오늘의 활동</CardTitle>
          <CardDescription>오늘 자동 생성된 콘텐츠 통계</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-4">
              <div className="text-sm text-muted-foreground">게시글</div>
              <div className="mt-2 text-2xl font-bold text-[#D4A853]">
                {stats.todayActivity.posts}
              </div>
            </div>
            <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-4">
              <div className="text-sm text-muted-foreground">댓글</div>
              <div className="mt-2 text-2xl font-bold text-[#D4A853]">
                {stats.todayActivity.comments}
              </div>
            </div>
            <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-4">
              <div className="text-sm text-muted-foreground">답글</div>
              <div className="mt-2 text-2xl font-bold text-[#D4A853]">
                {stats.todayActivity.replies}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
