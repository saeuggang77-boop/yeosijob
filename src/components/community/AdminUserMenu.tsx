"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserPostsModal } from "./UserPostsModal";
import { SendMessageModal } from "@/components/message/SendMessageModal";
import { SuspendModal } from "./SuspendModal";

interface AdminUserMenuProps {
  userId: string;
  userName: string;
  currentRole?: string;
  isPostAuthor?: boolean;
  isAdmin?: boolean;
  isUserActive?: boolean;
  userCreatedAt?: Date | string | null;
}

const NEW_USER_DAYS = 7;

function isNewMember(createdAt?: Date | string | null): boolean {
  if (!createdAt) return false;
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return false;
  return Date.now() - created < NEW_USER_DAYS * 24 * 60 * 60 * 1000;
}

export function AdminUserMenu({
  userId,
  userName,
  currentRole = "JOBSEEKER",
  isPostAuthor = false,
  isAdmin = false,
  isUserActive = true,
  userCreatedAt,
}: AdminUserMenuProps) {
  // 익명 표시 시 신규 배지 숨김 ("익명" 정확 매치만 — 관리자가 보는 "익명 (실명)"은 허용)
  const isPureAnonymous = userName === "익명";
  const isNew = isNewMember(userCreatedAt) && !isPureAnonymous;
  const [isOpen, setIsOpen] = useState(false);
  const [showRoleSubmenu, setShowRoleSubmenu] = useState(false);
  const [showPostsModal, setShowPostsModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // 메뉴 바깥 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowRoleSubmenu(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleViewPosts = () => {
    setIsOpen(false);
    setShowPostsModal(true);
  };

  const handleSendMessage = () => {
    setIsOpen(false);
    setShowMessageModal(true);
  };

  const handleChangeRole = async (newRole: "JOBSEEKER" | "BUSINESS") => {
    if (currentRole === newRole) return;

    const roleText = newRole === "JOBSEEKER" ? "구직자" : "업소사장";
    if (!confirm(`${userName}님의 등급을 ${roleText}로 변경하시겠습니까?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "changeRole", role: newRole }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message);
        router.refresh();
      } else {
        alert(data.error || "등급 변경에 실패했습니다");
      }
    } catch (error) {
      console.error("Role change error:", error);
      alert("등급 변경 중 오류가 발생했습니다");
    }

    setIsOpen(false);
    setShowRoleSubmenu(false);
  };

  const handleSuspend = () => {
    setIsOpen(false);
    setShowSuspendModal(true);
  };

  const handleUnsuspend = async () => {
    if (!confirm(`${userName}님의 활동정지를 해제하시겠습니까?`)) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unsuspend" }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message);
        router.refresh();
      } else {
        alert(data.error || "활동정지 해제에 실패했습니다");
      }
    } catch {
      alert("활동정지 해제 중 오류가 발생했습니다");
    }

    setIsOpen(false);
  };

  const handleKick = async () => {
    if (
      !confirm(
        `정말 ${userName}님을 강퇴하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 해당 유저의 모든 게시글과 댓글이 삭제됩니다.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message);
        router.refresh();
      } else {
        alert(data.error || "강퇴에 실패했습니다");
      }
    } catch (error) {
      console.error("Kick error:", error);
      alert("강퇴 중 오류가 발생했습니다");
    }

    setIsOpen(false);
  };

  return (
    <div ref={menuRef} className="relative inline-block">
      {/* 닉네임 버튼 */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="inline-flex items-center gap-1.5 font-medium underline decoration-dotted underline-offset-2 hover:text-primary"
      >
        {userName}
        {isNew && (
          <span className="rounded bg-green-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-green-500 no-underline">
            🌱 신규
          </span>
        )}
        {isPostAuthor && (
          <span className="rounded bg-primary/20 px-1.5 py-0.5 text-xs font-semibold text-primary no-underline">
            작성자
          </span>
        )}
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border border-border bg-card shadow-lg">
          {/* 게시글 보기 (관리자 전용 - 실유저 충분히 늘어나면 일반 공개) */}
          {isAdmin && (
            <button
              onClick={handleViewPosts}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-muted"
            >
              <span>📝</span>
              <span>게시글 보기</span>
            </button>
          )}

          {/* 쪽지보내기 */}
          <button
            onClick={handleSendMessage}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-muted"
          >
            <span>💌</span>
            <span>쪽지보내기</span>
          </button>

          {isAdmin && (
            <>
              {/* 등급변경 */}
              <div className="relative">
                <button
                  onMouseEnter={() => setShowRoleSubmenu(true)}
                  onClick={() => setShowRoleSubmenu(!showRoleSubmenu)}
                  className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm hover:bg-muted"
                >
                  <div className="flex items-center gap-2">
                    <span>👤</span>
                    <span>등급변경</span>
                  </div>
                  <span className="text-xs">▶</span>
                </button>

                {/* 등급변경 서브메뉴 */}
                {showRoleSubmenu && (
                  <div className="absolute left-0 top-full mt-1 min-w-[140px] rounded-lg border border-border bg-card shadow-lg md:left-full md:top-0 md:ml-1 md:mt-0">
                    <button
                      onClick={() => handleChangeRole("JOBSEEKER")}
                      disabled={currentRole === "JOBSEEKER"}
                      className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm ${
                        currentRole === "JOBSEEKER"
                          ? "cursor-not-allowed bg-muted/50 text-muted-foreground"
                          : "hover:bg-muted"
                      }`}
                    >
                      <span>구직자</span>
                      {currentRole === "JOBSEEKER" && (
                        <span className="ml-auto text-xs text-primary">현재</span>
                      )}
                    </button>
                    <button
                      onClick={() => handleChangeRole("BUSINESS")}
                      disabled={currentRole === "BUSINESS"}
                      className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm ${
                        currentRole === "BUSINESS"
                          ? "cursor-not-allowed bg-muted/50 text-muted-foreground"
                          : "hover:bg-muted"
                      }`}
                    >
                      <span>업소사장</span>
                      {currentRole === "BUSINESS" && (
                        <span className="ml-auto text-xs text-primary">현재</span>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* 활동정지 / 해제 */}
              {isUserActive ? (
                <button
                  onClick={handleSuspend}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-muted"
                >
                  <span>⏸️</span>
                  <span>활동정지</span>
                </button>
              ) : (
                <button
                  onClick={handleUnsuspend}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-green-500 hover:bg-green-500/10"
                >
                  <span>▶️</span>
                  <span>활동정지 해제</span>
                </button>
              )}

              {/* 강퇴시키기 */}
              <button
                onClick={handleKick}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-500 hover:bg-red-500/10"
              >
                <span>🚫</span>
                <span>강퇴시키기</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* User Posts Modal */}
      <UserPostsModal
        userId={userId}
        userName={userName}
        isOpen={showPostsModal}
        onClose={() => setShowPostsModal(false)}
      />

      {/* Send Message Modal */}
      <SendMessageModal
        receiverId={userId}
        receiverName={userName}
        isOpen={showMessageModal}
        onClose={() => setShowMessageModal(false)}
      />

      {/* Suspend Modal */}
      <SuspendModal
        userId={userId}
        userName={userName}
        isOpen={showSuspendModal}
        onClose={() => setShowSuspendModal(false)}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
