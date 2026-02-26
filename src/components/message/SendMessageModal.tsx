"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface SendMessageModalProps {
  receiverId: string;
  receiverName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function SendMessageModal({
  receiverId,
  receiverName,
  isOpen,
  onClose,
}: SendMessageModalProps) {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [canSend, setCanSend] = useState(true);
  const [reason, setReason] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const router = useRouter();

  const checkCanSend = async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/messages/can-send");
      if (res.ok) {
        const data = await res.json();
        setCanSend(data.canSend);
        setReason(data.reason || null);
      }
    } catch (error) {
      console.error("Failed to check send eligibility:", error);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setContent("");
      checkCanSend();
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSend = async () => {
    if (!content.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId, content: content.trim() }),
      });

      if (res.ok) {
        alert("쪽지를 보냈습니다");
        onClose();
      } else {
        const data = await res.json();
        alert(data.error || "쪽지 전송에 실패했습니다");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("쪽지 전송 중 오류가 발생했습니다");
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={handleOverlayClick}
    >
      <div
        className="relative flex w-full max-w-[500px] flex-col rounded-xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold">
            {receiverName}님에게 쪽지 보내기
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        {checking ? (
          <div className="flex items-center justify-center px-6 py-16">
            <p className="text-sm text-muted-foreground">확인 중...</p>
          </div>
        ) : !canSend && reason === "BUSINESS_NO_AD" ? (
          <div className="flex flex-col items-center gap-4 px-6 py-8">
            <p className="text-center text-sm text-muted-foreground">
              추천광고 이상 이용 회원만 쪽지를 보낼 수 있습니다
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  router.push("/business/ads/new");
                  onClose();
                }}
              >
                광고 등록하기
              </Button>
              <Button variant="ghost" onClick={onClose}>
                닫기
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="px-6 py-4">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, 500))}
                placeholder="쪽지 내용을 입력하세요"
                className="min-h-[150px] resize-none"
                maxLength={500}
              />
              <div className="mt-2 text-right text-xs text-muted-foreground">
                {content.length} / 500
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
              <Button variant="outline" onClick={onClose}>
                취소
              </Button>
              <Button
                onClick={handleSend}
                disabled={!content.trim() || sending}
              >
                {sending ? "전송 중..." : "보내기"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
