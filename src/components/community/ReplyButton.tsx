"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CommentForm } from "./CommentForm";

interface ReplyButtonProps {
  postId: string;
  parentId: string;
  replyToName: string;
}

export function ReplyButton({ postId, parentId, replyToName }: ReplyButtonProps) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        className="text-xs text-muted-foreground hover:text-primary"
        onClick={() => setShowForm(!showForm)}
      >
        답글
      </Button>
      {showForm && (
        <div className="mt-2">
          <CommentForm
            postId={postId}
            parentId={parentId}
            replyToName={replyToName}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}
    </div>
  );
}
