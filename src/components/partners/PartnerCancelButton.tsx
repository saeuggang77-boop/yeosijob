"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";

interface PartnerCancelButtonProps {
  partnerId: string;
}

export function PartnerCancelButton({ partnerId }: PartnerCancelButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCancel = async () => {
    if (!confirm("등록을 취소하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/partners/${partnerId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "삭제에 실패했습니다");
      }

      toast.success(data.message || "제휴업체 등록이 취소되었습니다");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "삭제에 실패했습니다");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Button
      size="sm"
      variant="ghost"
      className="text-red-500 hover:text-red-600"
      onClick={handleCancel}
      disabled={isDeleting}
    >
      {isDeleting ? "취소 중..." : "등록 취소"}
    </Button>
  );
}
