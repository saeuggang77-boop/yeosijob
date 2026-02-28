"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function AdDeleteButton({ adId }: { adId: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("이 광고를 삭제하시겠습니까? 관련 결제, 리뷰, 스크랩 데이터도 함께 삭제됩니다.")) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/ads/${adId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete");

      toast.success("광고가 삭제되었습니다");
      router.refresh();
    } catch {
      toast.error("삭제에 실패했습니다");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-xs"
    >
      {isDeleting ? "삭제중..." : "삭제"}
    </Button>
  );
}
