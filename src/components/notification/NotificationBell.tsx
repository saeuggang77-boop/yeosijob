"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Notification {
  id: string;
  title: string;
  message: string;
  link: string;
  isRead: boolean;
  createdAt: string;
}

function getTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "방금 전";
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  return `${diffDays}일 전`;
}

export function NotificationBell() {
  const { data: session } = useSession();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount);
        setNotifications(data.notifications.slice(0, 5)); // Only show latest 5 in dropdown
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  useEffect(() => {
    if (!session) return;

    // Initial fetch
    queueMicrotask(() => fetchNotifications());

    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, [session]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (id: string, link: string) => {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
      });
      fetchNotifications();
      setIsOpen(false);
      router.push(link);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
      });
      fetchNotifications();
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  if (!session) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={unreadCount > 0 ? `알림 ${unreadCount}개` : "알림"}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border bg-background shadow-lg">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h3 className="font-semibold">알림</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-primary hover:underline"
                aria-label="모든 알림 읽음 처리"
              >
                모두 읽음
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                알림이 없습니다
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleMarkAsRead(notification.id, notification.link)}
                  className="flex w-full items-start gap-3 border-b px-4 py-3 text-left hover:bg-accent"
                  aria-label={`${notification.title} 알림 읽기`}
                >
                  {!notification.isRead && (
                    <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{notification.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {getTimeAgo(notification.createdAt)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="border-t px-4 py-2 text-center">
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push("/notifications");
                }}
                className="text-xs text-primary hover:underline"
                aria-label="모든 알림 보기"
              >
                전체보기
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
