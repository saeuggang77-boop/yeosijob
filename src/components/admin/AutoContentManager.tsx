"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
import { Loader2, AlertTriangle, ChevronDown, ChevronUp, Pencil, Trash2, Check, X, ExternalLink } from "lucide-react";

interface Config {
  enabled: boolean;
  postsPerDay: number;
  commentsPerPost: number;
  commentsPerPostMin: number;
  commentsPerPostMax: number;
  repliesPerComment: number;
  activeStartHour: number;
  activeEndHour: number;
  realPostAutoReply: boolean;
  seoKeywords: string[];
  categoryWeights: Record<string, number>;
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

interface GhostUser {
  id: string;
  name: string;
  ghostPersonality: string | null;
  isActive: boolean;
}

interface PoolItem {
  id: string;
  title: string | null;
  content: string;
  personality: string;
  createdAt: string;
}

interface Stats {
  poolStats: PoolStat[];
  ghostStats: GhostStat[];
  totalGhostUsers: number;
  ghostUsers: GhostUser[];
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
  const [config, setConfig] = useState<Config>({
    ...initialConfig,
    seoKeywords: initialConfig.seoKeywords || [],
    commentsPerPostMin: initialConfig.commentsPerPostMin ?? 2,
    commentsPerPostMax: initialConfig.commentsPerPostMax ?? 8,
    categoryWeights: initialConfig.categoryWeights ?? { CHAT: 30, BEAUTY: 25, QNA: 25, WORK: 20 },
  });
  const [stats, setStats] = useState<Stats>(initialStats);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [creatingGhosts, setCreatingGhosts] = useState(false);
  const [showGhostList, setShowGhostList] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [showPoolItems, setShowPoolItems] = useState(false);
  const [poolItems, setPoolItems] = useState<PoolItem[]>([]);
  const [loadingPoolItems, setLoadingPoolItems] = useState(false);
  const [expandedPoolItemId, setExpandedPoolItemId] = useState<string | null>(null);
  const [selectedPoolIds, setSelectedPoolIds] = useState<Set<string>>(new Set());
  const [deletingSelected, setDeletingSelected] = useState(false);
  const [selectedGhostIds, setSelectedGhostIds] = useState<Set<string>>(new Set());
  const [deletingSelectedGhosts, setDeletingSelectedGhosts] = useState(false);

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
        await refreshGhostUsers();
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

  const refreshGhostUsers = async () => {
    try {
      const res = await fetch("/api/admin/auto-content/ghost-users");
      if (res.ok) {
        const data = await res.json();
        setStats(prev => ({ ...prev, ghostUsers: data.ghostUsers }));
      }
    } catch (error) {
      console.error("Ghost users refresh error:", error);
    }
  };

  const handleStartEdit = (user: GhostUser) => {
    setEditingUserId(user.id);
    setEditingName(user.name);
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditingName("");
  };

  const handleSaveEdit = async (userId: string) => {
    if (!editingName.trim()) {
      toast.error("닉네임을 입력해주세요");
      return;
    }

    try {
      const res = await fetch("/api/admin/auto-content/ghost-users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, name: editingName.trim() }),
      });

      if (res.ok) {
        toast.success("닉네임이 수정되었습니다");
        await refreshGhostUsers();
        handleCancelEdit();
      } else {
        const data = await res.json();
        toast.error(data.error || "수정에 실패했습니다");
      }
    } catch (error) {
      toast.error("수정 중 오류가 발생했습니다");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("이 유령회원을 삭제하시겠습니까?")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/auto-content/ghost-users?id=${userId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("유령회원이 삭제되었습니다");
        await refreshGhostUsers();
        await refreshStats();
      } else {
        const data = await res.json();
        toast.error(data.error || "삭제에 실패했습니다");
      }
    } catch (error) {
      toast.error("삭제 중 오류가 발생했습니다");
    }
  };

  const handleDeleteSelectedGhosts = async () => {
    if (selectedGhostIds.size === 0) return;
    if (!confirm(`선택한 ${selectedGhostIds.size}명의 유령회원을 삭제하시겠습니까?`)) return;

    setDeletingSelectedGhosts(true);
    try {
      const res = await fetch("/api/admin/auto-content/ghost-users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedGhostIds) }),
      });

      if (res.ok) {
        toast.success(`${selectedGhostIds.size}명의 유령회원이 삭제되었습니다`);
        setSelectedGhostIds(new Set());
        await refreshGhostUsers();
        await refreshStats();
      } else {
        const data = await res.json();
        toast.error(data.error || "삭제에 실패했습니다");
      }
    } catch (error) {
      toast.error("삭제 중 오류가 발생했습니다");
    } finally {
      setDeletingSelectedGhosts(false);
    }
  };

  const toggleGhostSelect = (userId: string) => {
    setSelectedGhostIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const toggleSelectAllGhosts = () => {
    if (selectedGhostIds.size === stats.ghostUsers.length) {
      setSelectedGhostIds(new Set());
    } else {
      setSelectedGhostIds(new Set(stats.ghostUsers.map(u => u.id)));
    }
  };

  // 키워드 관리는 /admin/auto-content/keywords 전용 페이지로 이동

  const loadPoolItems = async () => {
    setLoadingPoolItems(true);
    try {
      const res = await fetch("/api/admin/auto-content/pool");
      if (res.ok) {
        const data = await res.json();
        setPoolItems(data.poolItems);
      } else {
        toast.error("원고 목록 조회 실패");
      }
    } catch (error) {
      toast.error("원고 목록 조회 중 오류 발생");
    } finally {
      setLoadingPoolItems(false);
    }
  };

  const handleTogglePoolItems = async () => {
    if (!showPoolItems) {
      await loadPoolItems();
    }
    setShowPoolItems(!showPoolItems);
  };

  const handleDeletePoolItem = async (itemId: string) => {
    if (!confirm("이 원고를 삭제하시겠습니까?")) {
      return;
    }

    try {
      const res = await fetch("/api/admin/auto-content/pool", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [itemId] }),
      });

      if (res.ok) {
        toast.success("원고가 삭제되었습니다");
        setPoolItems(poolItems.filter(item => item.id !== itemId));
        await refreshStats();
      } else {
        const data = await res.json();
        toast.error(data.error || "삭제에 실패했습니다");
      }
    } catch (error) {
      toast.error("삭제 중 오류가 발생했습니다");
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedPoolIds.size === 0) return;
    if (!confirm(`선택한 ${selectedPoolIds.size}개의 원고를 삭제하시겠습니까?`)) return;

    setDeletingSelected(true);
    try {
      const res = await fetch("/api/admin/auto-content/pool", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedPoolIds) }),
      });

      if (res.ok) {
        toast.success(`${selectedPoolIds.size}개의 원고가 삭제되었습니다`);
        setPoolItems(poolItems.filter(item => !selectedPoolIds.has(item.id)));
        setSelectedPoolIds(new Set());
        await refreshStats();
      } else {
        const data = await res.json();
        toast.error(data.error || "삭제에 실패했습니다");
      }
    } catch (error) {
      toast.error("삭제 중 오류가 발생했습니다");
    } finally {
      setDeletingSelected(false);
    }
  };

  const togglePoolItemSelect = (itemId: string) => {
    setSelectedPoolIds(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedPoolIds.size === poolItems.length) {
      setSelectedPoolIds(new Set());
    } else {
      setSelectedPoolIds(new Set(poolItems.map(item => item.id)));
    }
  };

  return (
    <div className="space-y-6">
      {/* Vercel Pro 불필요 알림 */}
      {!config.enabled && stats.todayActivity.posts === 0 && stats.todayActivity.comments === 0 && stats.todayActivity.replies === 0 && (
        <div className="rounded-lg border border-yellow-600/50 bg-yellow-900/20 p-4">
          <div className="flex items-center gap-2 text-yellow-500">
            <AlertTriangle className="size-5 shrink-0" />
            <div>
              <p className="font-medium">Vercel Pro 플랜 확인</p>
              <p className="text-sm text-yellow-500/80">
                자동 콘텐츠가 비활성화되어 있습니다. 광고 자동 점프도 사용하지 않는다면 Vercel Pro($20/월)가 필요 없을 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      )}

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

          <div className="rounded-md bg-zinc-900 border border-zinc-700 p-3 text-xs text-muted-foreground space-y-1">
            <p>게시글마다 댓글 수가 최소~최대 범위 내에서 랜덤으로 결정됩니다.</p>
            <p>요일별 자동 변동: 금·토 +20~30% | 월·화 -10~20% | 수·목·일 ±10%</p>
            <p>예시: 게시글 8개 × 댓글 2~8개 = 하루 약 40개 (편중+요일 변동 적용)</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>일일 게시글 수 (기준값)</Label>
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
              <Label>게시글당 댓글 (최소~최대)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  max="20"
                  value={config.commentsPerPostMin}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      commentsPerPostMin: parseInt(e.target.value) || 0,
                    })
                  }
                  className="bg-zinc-900 border-zinc-700"
                  placeholder="최소"
                />
                <span className="text-muted-foreground">~</span>
                <Input
                  type="number"
                  min="0"
                  max="20"
                  value={config.commentsPerPostMax}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      commentsPerPostMax: parseInt(e.target.value) || 0,
                    })
                  }
                  className="bg-zinc-900 border-zinc-700"
                  placeholder="최대"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>댓글당 답글 (기준값)</Label>
              <Input
                type="number"
                min="0"
                max="5"
                value={config.repliesPerComment}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    repliesPerComment: parseInt(e.target.value) || 0,
                  })
                }
                className="bg-zinc-900 border-zinc-700"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-base font-medium">카테고리 비율</Label>
            <p className="text-sm text-muted-foreground">자동 생성 게시글의 카테고리 분배 비율</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { key: "CHAT", label: "수다방" },
                { key: "BEAUTY", label: "뷰티톡" },
                { key: "QNA", label: "질문방" },
                { key: "WORK", label: "업소톡" },
              ].map((cat) => (
                <div key={cat.key} className="flex items-center gap-2">
                  <Label className="w-16 shrink-0 text-sm">{cat.label}</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={config.categoryWeights[cat.key] ?? 0}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setConfig({
                        ...config,
                        categoryWeights: { ...config.categoryWeights, [cat.key]: val },
                      });
                    }}
                    className="bg-zinc-900 border-zinc-700 w-20"
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              합계: {Object.values(config.categoryWeights).reduce((a, b) => a + b, 0)}%
              {Object.values(config.categoryWeights).reduce((a, b) => a + b, 0) !== 100 && (
                <span className="text-yellow-500 ml-2">(100%가 아닙니다)</span>
              )}
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">24시간 운영</Label>
                <p className="text-sm text-muted-foreground">
                  시간 제한 없이 하루 종일 콘텐츠 생성
                </p>
              </div>
              <Switch
                checked={config.activeStartHour === config.activeEndHour}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setConfig({ ...config, activeStartHour: 0, activeEndHour: 0 });
                  } else {
                    setConfig({ ...config, activeStartHour: 14, activeEndHour: 4 });
                  }
                }}
              />
            </div>
            {config.activeStartHour !== config.activeEndHour && (
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
            )}
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

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">
                  SEO 키워드 ({config.seoKeywords.length}개)
                </Label>
                <p className="text-sm text-muted-foreground">
                  자동 생성 콘텐츠에 포함할 키워드
                </p>
              </div>
              <Link href="/admin/auto-content/keywords">
                <Button variant="outline" size="sm">
                  키워드 관리
                  <ExternalLink className="ml-1 size-3.5" />
                </Button>
              </Link>
            </div>
            {config.seoKeywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {config.seoKeywords.slice(0, 10).map((keyword) => (
                  <Badge
                    key={keyword}
                    variant="secondary"
                    className="text-[#D4A853]"
                  >
                    {keyword}
                  </Badge>
                ))}
                {config.seoKeywords.length > 10 && (
                  <Badge variant="outline" className="text-muted-foreground">
                    +{config.seoKeywords.length - 10}개 더
                  </Badge>
                )}
              </div>
            )}
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

          <div className="mt-4 flex items-center gap-2">
            <Button
              onClick={handleTogglePoolItems}
              variant="outline"
              size="sm"
              disabled={loadingPoolItems}
            >
              {loadingPoolItems && <Loader2 className="mr-2 size-4 animate-spin" />}
              {showPoolItems ? "원고 목록 숨기기" : "원고 목록 보기"}
              {!loadingPoolItems && (
                showPoolItems ? (
                  <ChevronUp className="ml-2 size-4" />
                ) : (
                  <ChevronDown className="ml-2 size-4" />
                )
              )}
            </Button>
            {showPoolItems && selectedPoolIds.size > 0 && (
              <Button
                onClick={handleDeleteSelected}
                variant="destructive"
                size="sm"
                disabled={deletingSelected}
              >
                {deletingSelected && <Loader2 className="mr-2 size-4 animate-spin" />}
                선택 삭제 ({selectedPoolIds.size}개)
              </Button>
            )}
          </div>

          {showPoolItems && (
            <div className="mt-4 rounded-lg border border-zinc-700 bg-zinc-900">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-700 hover:bg-zinc-900">
                    <TableHead className="w-10">
                      <input
                        type="checkbox"
                        checked={poolItems.length > 0 && selectedPoolIds.size === poolItems.length}
                        onChange={toggleSelectAll}
                        className="size-4 rounded border-zinc-600 accent-[#D4A853]"
                      />
                    </TableHead>
                    <TableHead className="text-muted-foreground">제목</TableHead>
                    <TableHead className="text-muted-foreground">내용</TableHead>
                    <TableHead className="text-muted-foreground">성격유형</TableHead>
                    <TableHead className="text-muted-foreground text-right">액션</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {poolItems.length === 0 ? (
                    <TableRow className="border-zinc-700">
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        미사용 원고가 없습니다
                      </TableCell>
                    </TableRow>
                  ) : (
                    poolItems.map((item) => (
                      <TableRow
                        key={item.id}
                        className={`border-zinc-700 cursor-pointer hover:bg-zinc-800 ${selectedPoolIds.has(item.id) ? "bg-zinc-800/50" : ""}`}
                        onClick={() =>
                          setExpandedPoolItemId(
                            expandedPoolItemId === item.id ? null : item.id
                          )
                        }
                      >
                        <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedPoolIds.has(item.id)}
                            onChange={() => togglePoolItemSelect(item.id)}
                            className="size-4 rounded border-zinc-600 accent-[#D4A853]"
                          />
                        </TableCell>
                        <TableCell className="font-medium max-w-[200px]">
                          <div className="flex items-center gap-1">
                            {expandedPoolItemId === item.id ? (
                              <ChevronUp className="size-3 shrink-0 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
                            )}
                            <span className="truncate">
                              {item.title || "제목 없음"}
                            </span>
                          </div>
                          {expandedPoolItemId === item.id && (
                            <div className="mt-3 whitespace-pre-wrap text-sm text-zinc-300 border-t border-zinc-700 pt-3">
                              {item.content}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[300px]">
                          {expandedPoolItemId !== item.id && (
                            <div className="line-clamp-2 text-sm text-muted-foreground">
                              {item.content}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[#D4A853]">
                            {PERSONALITY_LABELS[item.personality] || item.personality}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 hover:text-red-500"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePoolItem(item.id);
                            }}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
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

          <div className="flex items-center gap-2">
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

            <Button
              onClick={() => setShowGhostList(!showGhostList)}
              variant="outline"
              size="sm"
            >
              {showGhostList ? "회원 목록 숨기기" : "회원 목록 보기"}
              {showGhostList ? (
                <ChevronUp className="ml-2 size-4" />
              ) : (
                <ChevronDown className="ml-2 size-4" />
              )}
            </Button>

            {showGhostList && selectedGhostIds.size > 0 && (
              <Button
                onClick={handleDeleteSelectedGhosts}
                variant="destructive"
                size="sm"
                disabled={deletingSelectedGhosts}
              >
                {deletingSelectedGhosts && <Loader2 className="mr-2 size-4 animate-spin" />}
                선택 삭제 ({selectedGhostIds.size}명)
              </Button>
            )}
          </div>

          {showGhostList && (
            <div className="mt-4 rounded-lg border border-zinc-700 bg-zinc-900">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-700 hover:bg-zinc-900">
                    <TableHead className="w-10">
                      <input
                        type="checkbox"
                        checked={stats.ghostUsers.length > 0 && selectedGhostIds.size === stats.ghostUsers.length}
                        onChange={toggleSelectAllGhosts}
                        className="size-4 rounded border-zinc-600 accent-[#D4A853]"
                      />
                    </TableHead>
                    <TableHead className="text-muted-foreground">닉네임</TableHead>
                    <TableHead className="text-muted-foreground">성격유형</TableHead>
                    <TableHead className="text-muted-foreground text-right">액션</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.ghostUsers.map((user) => (
                    <TableRow key={user.id} className={`border-zinc-700 ${selectedGhostIds.has(user.id) ? "bg-zinc-800/50" : ""}`}>
                      <TableCell className="w-10">
                        <input
                          type="checkbox"
                          checked={selectedGhostIds.has(user.id)}
                          onChange={() => toggleGhostSelect(user.id)}
                          className="size-4 rounded border-zinc-600 accent-[#D4A853]"
                        />
                      </TableCell>
                      <TableCell>
                        {editingUserId === user.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleSaveEdit(user.id);
                                } else if (e.key === "Escape") {
                                  handleCancelEdit();
                                }
                              }}
                              className="h-8 bg-zinc-800 border-zinc-600"
                              autoFocus
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-8"
                              onClick={() => handleSaveEdit(user.id)}
                            >
                              <Check className="size-4 text-green-500" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-8"
                              onClick={handleCancelEdit}
                            >
                              <X className="size-4 text-red-500" />
                            </Button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEdit(user)}
                            className="flex items-center gap-2 hover:text-[#D4A853] transition-colors"
                          >
                            {user.name}
                            <Pencil className="size-3 opacity-50" />
                          </button>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {PERSONALITY_LABELS[user.ghostPersonality || ""] || user.ghostPersonality}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8 hover:text-red-500"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
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
