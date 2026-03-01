"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const REACTIONS = [
  { type: "LIKE", emoji: "👍", label: "좋아요" },
  { type: "FUNNY", emoji: "🤣", label: "웃겨요" },
  { type: "EMPATHY", emoji: "😭", label: "슬퍼요" },
  { type: "SURPRISE", emoji: "😱", label: "헐" },
  { type: "ANGRY", emoji: "😡", label: "화나요" },
  { type: "CHEER", emoji: "💪", label: "힘내요" },
] as const;

interface ReactionButtonProps {
  postId: string;
  initialReactions: Record<string, number>;
  initialUserReaction: string | null;
  isLoggedIn: boolean;
}

export function ReactionButton({
  postId,
  initialReactions,
  initialUserReaction,
  isLoggedIn,
}: ReactionButtonProps) {
  const [reactions, setReactions] = useState(initialReactions);
  const [userReaction, setUserReaction] = useState<string | null>(initialUserReaction);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleReaction = async (reactionType: string) => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    if (loading) return;

    // Optimistic update
    const prevReactions = { ...reactions };
    const prevUserReaction = userReaction;

    const newReactions = { ...reactions };

    // Remove old reaction count
    if (userReaction) {
      newReactions[userReaction] = Math.max(0, (newReactions[userReaction] || 0) - 1);
    }

    // Toggle or switch
    if (userReaction === reactionType) {
      setUserReaction(null);
    } else {
      setUserReaction(reactionType);
      newReactions[reactionType] = (newReactions[reactionType] || 0) + 1;
    }

    setReactions(newReactions);
    setLoading(true);

    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reactionType }),
      });

      if (res.ok) {
        const data = await res.json();
        setReactions(data.reactions);
        setUserReaction(data.userReaction);
      } else {
        // Rollback
        setReactions(prevReactions);
        setUserReaction(prevUserReaction);
      }
    } catch {
      // Rollback
      setReactions(prevReactions);
      setUserReaction(prevUserReaction);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {REACTIONS.map(({ type, emoji, label }) => {
        const count = reactions[type] || 0;
        const isActive = userReaction === type;

        return (
          <button
            key={type}
            onClick={() => handleReaction(type)}
            disabled={loading}
            className={`group flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 transition-all hover:bg-muted ${
              isActive ? "bg-primary/10 ring-1 ring-primary" : ""
            }`}
            title={label}
          >
            <span className="text-xl transition-transform group-hover:scale-125 sm:text-2xl">
              {emoji}
            </span>
            {count > 0 ? (
              <span className={`text-[10px] ${isActive ? "font-semibold text-primary" : "text-muted-foreground"}`}>
                {count}
              </span>
            ) : (
              <span className="text-[10px] text-muted-foreground">{label}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
