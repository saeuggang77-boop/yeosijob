"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function MarkAllReadButton() {
  const router = useRouter();

  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
      });

      if (res.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  return (
    <Button onClick={handleMarkAllAsRead} size="sm" variant="outline">
      모두 읽음 처리
    </Button>
  );
}
