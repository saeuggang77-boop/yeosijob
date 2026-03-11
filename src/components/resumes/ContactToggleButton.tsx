"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ContactToggleButtonProps {
  resumeId: string;
  initialContacted: boolean;
  size?: "sm" | "default";
}

export function ContactToggleButton({ resumeId, initialContacted, size = "sm" }: ContactToggleButtonProps) {
  const [contacted, setContacted] = useState(initialContacted);
  const [loading, setLoading] = useState(false);

  async function handleToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    try {
      const res = await fetch(`/api/resumes/${resumeId}/contact`, {
        method: contacted ? "DELETE" : "POST",
      });
      if (res.ok) {
        setContacted(!contacted);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant={contacted ? "default" : "outline"}
      size={size}
      onClick={handleToggle}
      disabled={loading}
      className={contacted
        ? "bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
        : "text-xs"
      }
    >
      {loading ? "..." : contacted ? "✓ 연락완료" : "연락완료"}
    </Button>
  );
}
