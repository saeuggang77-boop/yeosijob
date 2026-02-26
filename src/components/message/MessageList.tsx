"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { formatDateSmart } from "@/lib/utils/format";

interface Conversation {
  partnerId: string;
  partnerName: string;
  lastMessage: string;
  lastMessageAt: string;
  lastMessageSenderId: string | null;
  lastMessageIsRead: boolean;
  unreadCount: number;
}

interface MessageListProps {
  currentUserId: string;
}

export function MessageList({ currentUserId }: MessageListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/messages");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();

    // Poll every 30 seconds
    const interval = setInterval(fetchConversations, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </Card>
    );
  }

  if (conversations.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center text-muted-foreground">
          쪽지함이 비어있습니다
        </div>
      </Card>
    );
  }

  const truncate = (text: string, length: number) => {
    if (text.length <= length) return text;
    return text.slice(0, length) + "...";
  };

  return (
    <Card className="divide-y">
      {conversations.map((conv) => (
        <button
          key={conv.partnerId}
          onClick={() => router.push(`/messages/${conv.partnerId}`)}
          className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-muted/50"
        >
          {conv.unreadCount > 0 && (
            <div className="h-full w-1 flex-shrink-0 rounded-r bg-primary" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold">{conv.partnerName}</span>
              <span className="flex-shrink-0 text-xs text-muted-foreground">
                {formatDateSmart(conv.lastMessageAt)}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              {conv.lastMessageSenderId === currentUserId && !conv.lastMessageIsRead && (
                <span className="flex-shrink-0 text-xs font-medium text-primary">1</span>
              )}
              <p className="flex-1 truncate text-sm text-muted-foreground">
                {truncate(conv.lastMessage, 50)}
              </p>
              {conv.unreadCount > 0 && (
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                </span>
              )}
            </div>
          </div>
        </button>
      ))}
    </Card>
  );
}
