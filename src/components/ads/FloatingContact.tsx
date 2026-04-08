"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Phone, MessageCircle, Send, ClipboardList, MessageSquareText } from "lucide-react";
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
  adTitle?: string;
}

// 카카오톡 값이 오픈채팅/플러스친구 등 클릭 가능한 URL인지 판별
function isKakaoUrl(value: string): boolean {
  return /^https?:\/\/(open\.kakao\.com|pf\.kakao\.com|qr\.kakao\.com)/i.test(
    value.trim()
  );
}

export function FloatingContact({
  contactPhone,
  contactKakao,
  contactTelegram,
  isJobseekerWithoutResume = false,
  canApply = false,
  adId,
  hasApplied: initialHasApplied = false,
  adTitle,
}: FloatingContactProps) {
  const [hasApplied, setHasApplied] = useState(initialHasApplied);
  const [isApplying, setIsApplying] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const kakaoIsLink = contactKakao ? isKakaoUrl(contactKakao) : false;

  const messageTemplate = adTitle
    ? `안녕하세요, 여시잡에서 "${adTitle}" 공고 보고 연락드립니다. 상담 가능할까요?`
    : `안녕하세요, 여시잡에서 공고 보고 연락드립니다. 상담 가능할까요?`;

  const smsHref = `sms:${contactPhone}?body=${encodeURIComponent(messageTemplate)}`;

  const handleKakaoClick = () => {
    if (!contactKakao) return;

    const fullText = `${messageTemplate}\n\n[카카오톡 ID]\n${contactKakao}`;

    navigator.clipboard
      .writeText(fullText)
      .then(() => {
        toast.success("카카오톡 ID와 메시지가 복사되었어요", {
          description: `카톡 → 친구추가에서 "${contactKakao}" 검색 후 붙여넣기`,
          duration: 5000,
        });
      })
      .catch(() => {
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

  const hasMessageRow = Boolean(contactKakao || contactTelegram);

  // 카카오톡 버튼 (모바일 사이즈)
  const kakaoButtonMobile = contactKakao
    ? kakaoIsLink
      ? (
        <a
          href={contactKakao}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1"
        >
          <Button variant="outline" className="h-11 w-full gap-1 text-sm">
            <MessageCircle className="h-4 w-4" />
            <span>카카오톡</span>
          </Button>
        </a>
      )
      : (
        <Button
          variant="outline"
          className="h-11 flex-1 gap-1 text-sm"
          onClick={handleKakaoClick}
        >
          <MessageCircle className="h-4 w-4" />
          <span>카카오톡</span>
        </Button>
      )
    : null;

  // 카카오톡 버튼 (데스크탑 사이즈)
  const kakaoButtonDesktop = contactKakao
    ? kakaoIsLink
      ? (
        <a
          href={contactKakao}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1"
        >
          <Button variant="outline" className="w-full gap-1 text-xs">
            <MessageCircle className="h-3.5 w-3.5" />
            <span>카카오톡</span>
          </Button>
        </a>
      )
      : (
        <Button
          variant="outline"
          className="flex-1 gap-1 text-xs"
          onClick={handleKakaoClick}
        >
          <MessageCircle className="h-3.5 w-3.5" />
          <span>카카오톡</span>
        </Button>
      )
    : null;

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

      {/* 모바일 하단 고정바 (옵션 D: 카테고리 그루핑) */}
      <div className="fixed bottom-[68px] left-0 right-0 border-t bg-background p-3 md:hidden">
        <div className="space-y-2">
          {/* Row 1: 이력서로 지원하기 (full width) */}
          {canApply && (
            <div className="flex">
              {hasApplied ? (
                <Button
                  variant="outline"
                  className="h-11 w-full gap-2 text-sm opacity-60"
                  disabled
                >
                  <ClipboardList className="h-4 w-4" />
                  <span>지원완료</span>
                </Button>
              ) : (
                <Button
                  className="h-11 w-full gap-2 bg-blue-600 text-sm text-white hover:bg-blue-700"
                  onClick={() => setShowConfirmDialog(true)}
                  disabled={isApplying}
                >
                  <ClipboardList className="h-4 w-4" />
                  <span>{isApplying ? "지원중..." : "이력서로 지원하기"}</span>
                </Button>
              )}
            </div>
          )}

          {/* Row 2: 바로 연락 (전화 + 문자) */}
          <div className="flex gap-2">
            <a href={`tel:${contactPhone}`} className="flex-1">
              <Button className="h-11 w-full gap-1 text-sm">
                <Phone className="h-4 w-4" />
                <span>전화</span>
              </Button>
            </a>
            <a href={smsHref} className="flex-1">
              <Button variant="secondary" className="h-11 w-full gap-1 text-sm">
                <MessageSquareText className="h-4 w-4" />
                <span>문자</span>
              </Button>
            </a>
          </div>

          {/* Row 3: 메시지 (카톡 + 텔레, 등록된 채널만) */}
          {hasMessageRow && (
            <div className="flex gap-2">
              {kakaoButtonMobile}
              {contactTelegram && (
                <a
                  href={`https://t.me/${contactTelegram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button variant="outline" className="h-11 w-full gap-1 text-sm">
                    <Send className="h-4 w-4" />
                    <span>텔레그램</span>
                  </Button>
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 데스크탑 플로팅 카드 (옵션 D: 카테고리 그루핑) */}
      <div className="fixed bottom-6 right-6 z-50 hidden w-56 rounded-lg border bg-background p-4 shadow-lg md:block">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-foreground">연락하기</p>

          {/* 지원하기 */}
          {canApply && (
            hasApplied ? (
              <Button variant="outline" className="w-full gap-2 opacity-60" disabled>
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
                <span>{isApplying ? "지원중..." : "이력서 지원"}</span>
              </Button>
            )
          )}

          {/* 바로 연락 그룹 */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              바로 연락
            </p>
            <div className="flex gap-2">
              <a href={`tel:${contactPhone}`} className="flex-1">
                <Button className="w-full gap-1 text-xs">
                  <Phone className="h-3.5 w-3.5" />
                  <span>전화</span>
                </Button>
              </a>
              <a href={smsHref} className="flex-1">
                <Button variant="secondary" className="w-full gap-1 text-xs">
                  <MessageSquareText className="h-3.5 w-3.5" />
                  <span>문자</span>
                </Button>
              </a>
            </div>
          </div>

          {/* 메시지 그룹 */}
          {hasMessageRow && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                메시지
              </p>
              <div className="flex gap-2">
                {kakaoButtonDesktop}
                {contactTelegram && (
                  <a
                    href={`https://t.me/${contactTelegram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button variant="outline" className="w-full gap-1 text-xs">
                      <Send className="h-3.5 w-3.5" />
                      <span>텔레그램</span>
                    </Button>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
