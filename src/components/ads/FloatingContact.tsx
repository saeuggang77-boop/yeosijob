"use client";

import { Button } from "@/components/ui/button";
import { Phone, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface FloatingContactProps {
  contactPhone: string;
  contactKakao?: string | null;
  contactTelegram?: string | null;
  isJobseekerWithoutResume?: boolean;
}

export function FloatingContact({
  contactPhone,
  contactKakao,
  contactTelegram,
  isJobseekerWithoutResume = false,
}: FloatingContactProps) {
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

  return (
    <>
      {/* 모바일 하단 고정바 */}
      <div className="fixed bottom-[68px] left-0 right-0 border-t bg-background p-3 md:hidden">
        <div className="flex gap-2">
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
