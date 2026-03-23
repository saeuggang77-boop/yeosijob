"use client";

import { useState, useRef, useCallback } from "react";

interface PaymentMemoProps {
  paymentId: string;
  initialMemo: string | null;
}

export function PaymentMemo({ paymentId, initialMemo }: PaymentMemoProps) {
  const [memo, setMemo] = useState(initialMemo || "");
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const saveMemo = useCallback(
    async (value: string) => {
      try {
        await fetch(`/api/admin/payments/${paymentId}/memo`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memo: value }),
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      } catch {
        // silent fail
      }
    },
    [paymentId]
  );

  const handleChange = (value: string) => {
    setMemo(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => saveMemo(value), 800);
  };

  const handleDisplayClick = () => {
    setEditing(true);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handleBlur = () => {
    setEditing(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      saveMemo(memo);
    }
  };

  // 메모가 있고 편집 중이 아닐 때: 골드 테두리 표시
  if (memo && !editing) {
    return (
      <div className="mt-3 border-t border-dashed border-border pt-3">
        <p className="mb-1.5 flex items-center gap-1 text-xs text-muted-foreground">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          관리자 메모
        </p>
        <div
          onClick={handleDisplayClick}
          className="cursor-pointer rounded-md border border-amber-600/50 bg-amber-500/5 px-3 py-2 text-sm text-amber-500 hover:bg-amber-500/10"
        >
          {memo}
        </div>
      </div>
    );
  }

  // 비어있거나 편집 중: 입력란
  return (
    <div className="mt-3 border-t border-dashed border-border pt-3">
      <p className="mb-1.5 flex items-center gap-1 text-xs text-muted-foreground">
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
        관리자 메모
        {saved && <span className="ml-2 text-emerald-500">저장됨</span>}
      </p>
      <textarea
        ref={textareaRef}
        value={memo}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        rows={1}
        placeholder="메모를 입력하세요 (자동 저장)"
        className="w-full resize-none rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-amber-600/50 focus:outline-none"
      />
    </div>
  );
}
