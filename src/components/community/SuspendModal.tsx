"use client";

import { useState } from "react";

interface SuspendModalProps {
  userId: string;
  userName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const REASONS = [
  { value: "광고/스팸 활동", label: "광고/스팸 활동" },
  { value: "바람직하지 않은 활동 (도배, 욕설, 비방 등)", label: "바람직하지 않은 활동 (도배, 욕설, 비방 등)" },
  { value: "운영 원칙 위배", label: "운영 원칙 위배" },
  { value: "custom", label: "기타 (직접 입력)" },
];

const DURATIONS = [
  { value: 1, label: "1일" },
  { value: 3, label: "3일" },
  { value: 5, label: "5일" },
  { value: 7, label: "7일" },
  { value: 14, label: "14일" },
  { value: 30, label: "30일" },
  { value: 0, label: "무기한" },
];

export function SuspendModal({ userId, userName, isOpen, onClose, onSuccess }: SuspendModalProps) {
  const [selectedReason, setSelectedReason] = useState("바람직하지 않은 활동 (도배, 욕설, 비방 등)");
  const [customReason, setCustomReason] = useState("");
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const isCustom = selectedReason === "custom";
  const finalReason = isCustom ? customReason.trim() : selectedReason;

  const handleSubmit = async () => {
    if (!finalReason) {
      alert("사유를 입력해주세요");
      return;
    }
    if (isCustom && customReason.length > 25) {
      alert("사유는 25자 이내로 입력해주세요");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "suspend", reason: finalReason, days }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message);
        onSuccess();
        onClose();
      } else {
        alert(data.error || "활동정지에 실패했습니다");
      }
    } catch {
      alert("활동정지 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="mx-4 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <h3 className="text-lg font-bold">활동정지</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          <span className="font-semibold text-primary">{userName}</span>님을 활동정지 합니다.
        </p>

        {/* 사유 선택 */}
        <div className="mt-5">
          <label className="text-sm font-medium">정지 사유</label>
          <div className="mt-2 space-y-2">
            {REASONS.map((r) => (
              <label
                key={r.value}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors ${
                  selectedReason === r.value
                    ? "border-primary bg-primary/10"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <input
                  type="radio"
                  name="reason"
                  value={r.value}
                  checked={selectedReason === r.value}
                  onChange={() => setSelectedReason(r.value)}
                  className="accent-primary"
                />
                <span>{r.label}</span>
              </label>
            ))}
          </div>

          {/* 기타 직접 입력 */}
          {isCustom && (
            <div className="mt-2">
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="사유를 입력하세요 (25자 이내)"
                maxLength={25}
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
              />
              <p className="mt-1 text-right text-xs text-muted-foreground">
                {customReason.length}/25
              </p>
            </div>
          )}
        </div>

        {/* 기간 선택 */}
        <div className="mt-5">
          <label className="text-sm font-medium">정지 기간</label>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
          >
            {DURATIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        {/* 안내 */}
        <div className="mt-4 rounded-lg bg-muted/50 px-4 py-3 text-xs text-muted-foreground">
          {days === 0
            ? "무기한 정지는 관리자가 직접 해제해야 합니다."
            : `${days}일 후 로그인 시 자동으로 해제됩니다.`}
          <br />
          해당 회원에게 알림이 발송됩니다.
        </div>

        {/* 버튼 */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium hover:bg-muted"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || (isCustom && !customReason.trim())}
            className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "처리 중..." : "활동정지"}
          </button>
        </div>
      </div>
    </div>
  );
}
