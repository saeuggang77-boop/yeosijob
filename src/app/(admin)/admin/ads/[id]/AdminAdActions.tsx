"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminAdActions({ adId }: { adId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleAction(action: "approve" | "reject") {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/ads/${adId}/${action}`, { method: "POST" });
      if (res.ok) {
        router.refresh();
      } else {
        alert("처리 실패");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-2">
      <Button onClick={() => handleAction("approve")} disabled={loading}>
        승인
      </Button>
      <Button variant="destructive" onClick={() => handleAction("reject")} disabled={loading}>
        반려
      </Button>
    </div>
  );
}
