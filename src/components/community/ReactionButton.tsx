"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

const REACTIONS = [
  { type: "LIKE", emoji: "👍", label: "추천" },
  { type: "FUNNY", emoji: "😂", label: "웃겨요" },
  { type: "EMPATHY", emoji: "😢", label: "공감" },
  { type: "SURPRISE", emoji: "😮", label: "놀라워요" },
  { type: "CHEER", emoji: "💪", label: "힘내요" },
] as const;

type ReactionType = typeof REACTIONS[number]["type"];

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
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    }

    if (showPicker) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showPicker]);

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
    setShowPicker(false);
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

  // Calculate total reactions
  const totalReactions = Object.values(reactions).reduce((sum, count) => sum + count, 0);

  return (
    <div className="relative" ref={pickerRef}>
      {/* Main button */}
      <button
        onClick={() => setShowPicker(!showPicker)}
        disabled={loading}
        className="flex items-center gap-2 text-sm transition-colors hover:text-primary"
      >
        {/* Show user's reaction or default */}
        {userReaction ? (
          <span className="text-2xl">
            {REACTIONS.find((r) => r.type === userReaction)?.emoji || "👍"}
          </span>
        ) : (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        )}

        {/* Reaction summary */}
        {totalReactions > 0 ? (
          <div className="flex items-center gap-1.5">
            {REACTIONS.map(({ type, emoji }) => {
              const count = reactions[type] || 0;
              if (count === 0) return null;
              return (
                <span key={type} className="text-xs">
                  {emoji} {count}
                </span>
              );
            })}
          </div>
        ) : (
          <span className="text-muted-foreground">반응하기</span>
        )}
      </button>

      {/* Reaction picker */}
      {showPicker && (
        <div className="absolute bottom-full left-0 mb-2 rounded-lg border border-border bg-background p-2 shadow-lg animate-in zoom-in-95 duration-100">
          <div className="flex gap-1">
            {REACTIONS.map(({ type, emoji, label }) => (
              <button
                key={type}
                onClick={() => handleReaction(type)}
                className={`group relative flex flex-col items-center gap-1 rounded-lg p-2 transition-all hover:bg-muted ${
                  userReaction === type ? "bg-primary/10 ring-1 ring-primary" : ""
                }`}
                title={label}
              >
                <span className="text-2xl transition-transform group-hover:scale-125">
                  {emoji}
                </span>
                <span className="text-[10px] text-muted-foreground">{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
