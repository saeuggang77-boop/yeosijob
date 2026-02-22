"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface ResumeActionsProps {
  resumeId: string;
  isPublic: boolean;
}

export function ResumeActions({ resumeId, isPublic }: ResumeActionsProps) {
  const router = useRouter();
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggleVisibility = async () => {
    setIsToggling(true);
    try {
      const response = await fetch(`/api/admin/resumes/${resumeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: !isPublic }),
      });

      if (!response.ok) throw new Error("Failed to update");

      toast.success(isPublic ? "이력서를 숨겼습니다" : "이력서를 공개했습니다");
      router.refresh();
    } catch (error) {
      toast.error("작업에 실패했습니다");
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("이력서를 삭제하시겠습니까?")) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/resumes/${resumeId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete");

      toast.success("이력서가 삭제되었습니다");
      router.refresh();
    } catch (error) {
      toast.error("삭제에 실패했습니다");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleToggleVisibility}
        disabled={isToggling || isDeleting}
      >
        {isPublic ? "숨기기" : "공개"}
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={handleDelete}
        disabled={isToggling || isDeleting}
      >
        삭제
      </Button>
    </div>
  );
}
