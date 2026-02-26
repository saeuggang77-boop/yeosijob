"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, ShieldBan, ShieldCheck } from "lucide-react";
import { formatDateSmart } from "@/lib/utils/format";

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
}

interface ConversationViewProps {
  partnerId: string;
  partnerName: string;
  currentUserId: string;
}

export function ConversationView({
  partnerId,
  partnerName,
  currentUserId,
}: ConversationViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/messages/${partnerId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  };

  const markAsRead = async () => {
    try {
      await fetch(`/api/messages/${partnerId}/read`, {
        method: "PATCH",
      });
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const checkBlockStatus = async () => {
    try {
      const res = await fetch("/api/messages/block");
      if (res.ok) {
        const data = await res.json();
        const blocked = data.blocks?.some(
          (b: { blockedId: string }) => b.blockedId === partnerId
        );
        setIsBlocked(!!blocked);
      }
    } catch (error) {
      console.error("Failed to check block status:", error);
    }
  };

  const handleBlock = async () => {
    if (isBlocked) {
      if (!confirm("차단을 해제하시겠습니까?")) return;
      try {
        const res = await fetch("/api/messages/block", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blockedId: partnerId }),
        });
        if (res.ok) setIsBlocked(false);
      } catch (error) {
        console.error("Unblock error:", error);
      }
    } else {
      if (!confirm("이 사용자의 쪽지를 차단하시겠습니까?")) return;
      try {
        const res = await fetch("/api/messages/block", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blockedId: partnerId }),
        });
        if (res.ok) setIsBlocked(true);
      } catch (error) {
        console.error("Block error:", error);
      }
    }
  };

  useEffect(() => {
    fetchMessages();
    markAsRead();
    checkBlockStatus();

    // Poll every 15 seconds
    const interval = setInterval(fetchMessages, 15000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: partnerId,
          content: newMessage.trim(),
        }),
      });

      if (res.ok) {
        setNewMessage("");
        await fetchMessages();
        scrollToBottom();
      } else {
        const data = await res.json();
        alert(data.error || "메시지 전송에 실패했습니다");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("메시지 전송 중 오류가 발생했습니다");
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const groupMessagesByDate = (msgs: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    msgs.forEach((msg) => {
      const date = new Date(msg.createdAt);
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(msg);
    });
    return groups;
  };

  const getDateLabel = (dateKey: string) => {
    const [year, month, day] = dateKey.split("-");
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday =
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();

    const isYesterday =
      date.getFullYear() === yesterday.getFullYear() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getDate() === yesterday.getDate();

    if (isToday) return "오늘";
    if (isYesterday) return "어제";
    return `${year}년 ${month}월 ${day}일`;
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/messages")}
          aria-label="뒤로 가기"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="flex-1 text-lg font-semibold">{partnerName}</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBlock}
          aria-label={isBlocked ? "차단 해제" : "차단"}
          className={isBlocked ? "text-destructive" : "text-muted-foreground"}
        >
          {isBlocked ? (
            <ShieldBan className="h-5 w-5" />
          ) : (
            <ShieldCheck className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {Object.entries(messageGroups).map(([dateKey, msgs]) => (
          <div key={dateKey}>
            {/* Date separator */}
            <div className="mb-4 flex items-center justify-center">
              <div className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                {getDateLabel(dateKey)}
              </div>
            </div>

            {/* Messages for this date */}
            <div className="space-y-3">
              {msgs.map((msg) => {
                const isMyMessage = msg.senderId === currentUserId;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMyMessage ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`flex max-w-[70%] flex-col gap-1 ${isMyMessage ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`rounded-2xl px-4 py-2 ${
                          isMyMessage
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words text-sm">
                          {msg.content}
                        </p>
                      </div>
                      <span className="px-2 text-xs text-muted-foreground">
                        {formatDateSmart(msg.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t px-4 py-3">
        {isBlocked ? (
          <p className="text-center text-sm text-muted-foreground">
            차단된 사용자입니다. 차단을 해제하면 쪽지를 보낼 수 있습니다.
          </p>
        ) : (
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="메시지를 입력하세요"
              disabled={sending}
            />
            <Button
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
