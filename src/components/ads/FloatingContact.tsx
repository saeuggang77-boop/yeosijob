"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Phone, MessageCircle, Send, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface FloatingContactProps {
  contactPhone: string;
  contactKakao?: string | null;
  contactTelegram?: string | null;
  isJobseekerWithoutResume?: boolean;
  canApply?: boolean;
  adId?: string;
  hasApplied?: boolean;
}

export function FloatingContact({
  contactPhone,
  contactKakao,
  contactTelegram,
  isJobseekerWithoutResume = false,
  canApply = false,
  adId,
  hasApplied: initialHasApplied = false,
}: FloatingContactProps) {
  const [hasApplied, setHasApplied] = useState(initialHasApplied);
  const [isApplying, setIsApplying] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleKakaoClick = () => {
    if (!contactKakao) return;

    navigator.clipboard.writeText(contactKakao).then(() => {
      toast.success("카카오톡 ID가 복사되었습니다", {
        description: contactKakao,
      });
    }).catch(() => {
      toast.error("복사에 실패했습니다");
    });
  };

  const handleApply = async () => {
    if (!adId || hasApplied || isApplying) return;
    setIsApplying(true);
    setShowConfirmDialog(false);

    try {
      const res = await fetch(`/api/ads/${adId}/apply`, { method: "POST" });
      const data = await res.json();

      if (res.ok) {
        setHasApplied(true);
        toast.success("지원이 완료되었습니다!", {
          description: "사장님에게 알림이 발송되었습니다.",
        });
      } else {
        toast.error(data.error || "지원에 실패했습니다");
      }
    } catch {
      toast.error("네트워크 오류가 발생했습니다");
    } finally {
      setIsApplying(false);
    }
  };

  // 이력서 미등록 구직자
  if (isJobseekerWithoutResume) {
    return (
      <>
        {/* 모바일 하단 고정바 */}
        <div className="fixed bottom-[68px] left-0 right-0 border-t bg-background p-3 md:hidden">
          <Link href="/jobseeker/my-resume">
            <Button variant="outline" className="h-12 w-full text-base">
              이력서를 먼저 등록해주세요
            </Button>
          </Link>
        </div>

        {/* 데스크탑 플로팅 카드 */}
        <div className="fixed bottom-6 right-6 z-50 hidden rounded-lg border bg-background p-4 shadow-lg md:block">
          <Link href="/jobseeker/my-resume">
            <Button variant="outline" className="whitespace-nowrap">
              이력서를 먼저 등록해주세요
            </Button>
          </Link>
        </div>
      </>
    );
  }

  const applyButton = canApply ? (
    hasApplied ? (
      <Button
        variant="outline"
        className="h-12 flex-1 gap-2 text-base opacity-60"
        disabled
      >
        <ClipboardList className="h-5 w-5" />
        <span>지원완료</span>
      </Button>
    ) : (
      <Button
        className="h-12 flex-1 gap-2 bg-blue-600 text-base text-white hover:bg-blue-700"
        onClick={() => setShowConfirmDialog(true)}
        disabled={isApplying}
      >
        <ClipboardList className="h-5 w-5" />
        <span>{isApplying ? "지원중..." : "지원하기"}</span>
      </Button>
    )
  ) : null;

  const applyButtonDesktop = canApply ? (
    hasApplied ? (
      <Button
        variant="outline"
        className="w-full gap-2 opacity-60"
        disabled
      >
        <ClipboardList className="h-4 w-4" />
        <span>지원완료</span>
      </Button>
    ) : (
      <Button
        className="w-full gap-2 bg-blue-600 text-white hover:bg-blue-700"
        onClick={() => setShowConfirmDialog(true)}
        disabled={isApplying}
      >
        <ClipboardList className="h-4 w-4" />
        <span>{isApplying ? "지원중..." : "지원하기"}</span>
      </Button>
    )
  ) : null;

  return (
    <>
      {/* 지원 확인 다이얼로그 */}
      {showConfirmDialog && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
          <div className="w-[90%] max-w-sm rounded-xl border bg-background p-6 shadow-2xl">
            <h3 className="text-lg font-semibold">이력서를 지원하시겠습니까?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              내 이력서가 사장님에게 전달됩니다. 지원 후에는 취소할 수 없습니다.
            </p>
            <div className="mt-5 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowConfirmDialog(false)}
              >
                취소
              </Button>
              <Button
                className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
                onClick={handleApply}
                disabled={isApplying}
              >
                {isApplying ? "지원중..." : "지원하기"}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 모바일 하단 고정바 */}
      <div className="fixed bottom-[68px] left-0 right-0 border-t bg-background p-3 md:hidden">
        <div className="flex gap-2">
          {/* 지원하기 버튼 */}
          {applyButton}

          {/* 전화 버튼 */}
          <a href={`tel:${contactPhone}`} className="flex-1">
            <Button className="h-12 w-full gap-2 text-base">
              <Phone className="h-5 w-5" />
              <span>전화</span>
            </Button>
          </a>

          {/* 카카오톡 버튼 */}
          {contactKakao && (
            <Button
              variant="outline"
              className="h-12 flex-1 gap-2 text-base"
              onClick={handleKakaoClick}
            >
              <MessageCircle className="h-5 w-5" />
              <span>카카오톡</span>
            </Button>
          )}

          {/* 텔레그램 버튼 */}
          {contactTelegram && (
            <a
              href={`https://t.me/${contactTelegram.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <Button variant="outline" className="h-12 w-full gap-2 text-base">
                <Send className="h-5 w-5" />
                <span>텔레그램</span>
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* 데스크탑 플로팅 카드 */}
      <div className="fixed bottom-6 right-6 z-50 hidden rounded-lg border bg-background p-4 shadow-lg md:block">
        <div className="flex flex-col gap-2">
          <p className="mb-1 text-sm font-medium text-muted-foreground">연락하기</p>

          {/* 지원하기 버튼 */}
          {applyButtonDesktop}

          {/* 전화 버튼 */}
          <a href={`tel:${contactPhone}`}>
            <Button className="w-full gap-2">
              <Phone className="h-4 w-4" />
              <span>전화하기</span>
            </Button>
          </a>

          {/* 카카오톡 버튼 */}
          {contactKakao && (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleKakaoClick}
            >
              <MessageCircle className="h-4 w-4" />
              <span>카카오톡</span>
            </Button>
          )}

          {/* 텔레그램 버튼 */}
          {contactTelegram && (
            <a
              href={`https://t.me/${contactTelegram.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="w-full gap-2">
                <Send className="h-4 w-4" />
                <span>텔레그램</span>
              </Button>
            </a>
          )}
        </div>
      </div>
    </>
  );
}
