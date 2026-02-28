"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Bell, BellOff, Moon, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface NotifSettings {
  role: string;
  notifyMessage: boolean;
  notifyComment: boolean;
  notifyNotice: boolean;
  notifyLike: boolean;
  notifyResume: boolean;
  quietHoursStart: number | null;
  quietHoursEnd: number | null;
}

export default function NotificationSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState<NotifSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/notifications/settings")
        .then((res) => res.json())
        .then((data) => {
          setSettings(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status]);

  const updateSetting = useCallback(
    async (field: string, value: boolean | number | null) => {
      if (!settings) return;
      setSaving(field);
      const prev = { ...settings };
      setSettings({ ...settings, [field]: value });

      try {
        const res = await fetch("/api/notifications/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [field]: value }),
        });
        if (!res.ok) {
          setSettings(prev);
        }
      } catch {
        setSettings(prev);
      } finally {
        setSaving(null);
      }
    },
    [settings]
  );

  const toggleQuietHours = useCallback(
    async (enabled: boolean) => {
      if (!settings) return;
      if (enabled) {
        await updateSetting("quietHoursStart", 23);
        // 두 번째 필드는 첫 번째 완료 후
        setTimeout(() => updateSetting("quietHoursEnd", 7), 100);
      } else {
        await updateSetting("quietHoursStart", null);
        setTimeout(() => updateSetting("quietHoursEnd", null), 100);
      }
    },
    [settings, updateSetting]
  );

  if (status === "loading" || loading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-32 rounded bg-muted" />
          <div className="h-48 rounded-xl bg-muted" />
          <div className="h-48 rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  if (!settings) return null;

  const isBusiness = settings.role === "BUSINESS";
  const quietEnabled = settings.quietHoursStart !== null;
  const profileLink = isBusiness ? "/business/profile" : "/jobseeker/profile";

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* 헤더 */}
      <div className="mb-6">
        <Link
          href={profileLink}
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          마이페이지
        </Link>
        <h1 className="text-2xl font-bold">알림 설정</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          받고 싶은 알림을 선택하세요
        </p>
      </div>

      {/* 푸시 알림 */}
      <div className="mb-4 overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-[15px] font-semibold text-primary">푸시 알림</h2>
          <p className="text-xs text-muted-foreground">
            홈 화면에 설치하면 앱처럼 알림을 받을 수 있어요
          </p>
        </div>

        <ToggleItem
          label="쪽지 알림"
          desc="새로운 쪽지를 받으면 알려드려요"
          badge="푸시"
          badgeType="push"
          checked={settings.notifyMessage}
          saving={saving === "notifyMessage"}
          onChange={(v) => updateSetting("notifyMessage", v)}
        />
        <ToggleItem
          label="댓글 알림"
          desc="내 글에 댓글이나 답글이 달리면 알려드려요"
          badge="푸시"
          badgeType="push"
          checked={settings.notifyComment}
          saving={saving === "notifyComment"}
          onChange={(v) => updateSetting("notifyComment", v)}
        />
        <ToggleItem
          label="공지사항 알림"
          desc="새로운 공지사항이 등록되면 알려드려요"
          badge="푸시"
          badgeType="push"
          checked={settings.notifyNotice}
          saving={saving === "notifyNotice"}
          onChange={(v) => updateSetting("notifyNotice", v)}
        />
      </div>

      {/* 사이트 알림 */}
      <div className="mb-4 overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-[15px] font-semibold text-primary">사이트 알림</h2>
          <p className="text-xs text-muted-foreground">
            사이트 내 종 아이콘에 표시되는 알림
          </p>
        </div>

        <ToggleItem
          label="좋아요 알림"
          desc="내 글에 좋아요가 달리면 알려드려요"
          badge="종"
          badgeType="bell"
          checked={settings.notifyLike}
          saving={saving === "notifyLike"}
          onChange={(v) => updateSetting("notifyLike", v)}
        />
        {isBusiness && (
          <ToggleItem
            label="이력서 알림"
            desc="새 이력서가 등록되면 사장님에게 알려드려요"
            badge="종"
            badgeType="bell"
            checked={settings.notifyResume}
            saving={saving === "notifyResume"}
            onChange={(v) => updateSetting("notifyResume", v)}
          />
        )}
      </div>

      {/* 방해금지 시간 */}
      <div className="mb-4 overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-[15px] font-semibold text-primary">방해금지 시간</h2>
          <p className="text-xs text-muted-foreground">
            설정한 시간에는 푸시 알림을 보내지 않아요
          </p>
        </div>

        <div className="px-5 py-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Moon className="size-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">방해금지 모드</div>
                <div className="text-xs text-muted-foreground">
                  야간 시간 푸시 알림 차단
                </div>
              </div>
            </div>
            <Toggle
              checked={quietEnabled}
              onChange={(v) => toggleQuietHours(v)}
            />
          </div>

          {quietEnabled && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-muted/50 p-3">
              <TimeSelect
                value={settings.quietHoursStart ?? 23}
                onChange={(v) => updateSetting("quietHoursStart", v)}
                options={[22, 23, 0, 1]}
              />
              <span className="text-sm text-muted-foreground">부터</span>
              <TimeSelect
                value={settings.quietHoursEnd ?? 7}
                onChange={(v) => updateSetting("quietHoursEnd", v)}
                options={[6, 7, 8, 9]}
              />
              <span className="text-sm text-muted-foreground">까지</span>
            </div>
          )}
        </div>
      </div>

      {/* 안내 */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-[13px] leading-relaxed text-primary">
        푸시 알림은 홈 화면에 여시잡을 설치해야 받을 수 있어요.
        <br />
        사이트 알림은 설치 없이도 사이트 접속 시 확인 가능합니다.
      </div>

      <div className="h-20 md:hidden" />
    </div>
  );
}

/* ── 토글 아이템 ── */
function ToggleItem({
  label,
  desc,
  badge,
  badgeType,
  checked,
  saving,
  onChange,
}: {
  label: string;
  desc: string;
  badge: string;
  badgeType: "push" | "bell";
  checked: boolean;
  saving: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between border-t border-border px-5 py-3.5">
      <div className="flex-1">
        <div className="flex items-center gap-1.5 text-sm font-medium">
          {label}
          <span
            className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${
              badgeType === "push"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {badge}
          </span>
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground">{desc}</div>
      </div>
      <div className="relative ml-4">
        <Toggle checked={checked} onChange={onChange} />
        {saving && (
          <div className="absolute -right-1 -top-1 size-2 animate-pulse rounded-full bg-primary" />
        )}
      </div>
    </div>
  );
}

/* ── 토글 스위치 ── */
function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
        checked ? "bg-primary" : "bg-muted-foreground/30"
      }`}
    >
      <span
        className={`inline-block size-[22px] rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-[22px]" : "translate-x-[3px]"
        }`}
      />
    </button>
  );
}

/* ── 시간 선택 ── */
function TimeSelect({
  value,
  onChange,
  options,
}: {
  value: number;
  onChange: (v: number) => void;
  options: number[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
    >
      {options.map((h) => (
        <option key={h} value={h}>
          {String(h).padStart(2, "0")}:00
        </option>
      ))}
    </select>
  );
}
