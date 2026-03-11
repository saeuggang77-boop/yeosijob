"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ContactToggleButtonProps {
  resumeId: string;
  initialContacted: boolean;
  size?: "sm" | "default";
  variant?: "list" | "detail";
}

export function ContactToggleButton({ resumeId, initialContacted, size = "sm", variant = "list" }: ContactToggleButtonProps) {
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

  const contactedClass = "bg-emerald-600 hover:bg-emerald-700 text-white";
  const uncontactedClass = variant === "detail"
    ? "border-[#D4A853] text-[#D4A853] hover:bg-[#D4A853]/10"
    : "";

  const label = loading
    ? "..."
    : contacted
      ? "✓ 연락완료"
      : variant === "detail"
        ? "📞 연락했어요"
        : "미연락";

  return (
    <Button
      variant={contacted ? "default" : "outline"}
      size={size}
      onClick={handleToggle}
      disabled={loading}
      className={`text-xs ${contacted ? contactedClass : uncontactedClass}`}
    >
      {label}
    </Button>
  );
}
