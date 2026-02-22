"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ScrapButtonProps {
  adId: string;
  initialScraped: boolean;
}

export function ScrapButton({ adId, initialScraped }: ScrapButtonProps) {
  const [scraped, setScraped] = useState(initialScraped);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/scraps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adId }),
      });

      if (response.status === 401) {
        alert("로그인이 필요합니다");
        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "스크랩 처리에 실패했습니다");
      }

      const data = await response.json();
      setScraped(data.scraped);
    } catch (err) {
      alert(err instanceof Error ? err.message : "오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      disabled={isLoading}
      className="gap-1"
      aria-label={scraped ? "스크랩 취소" : "스크랩"}
    >
      {scraped ? (
        <>
          <svg className="h-4 w-4 fill-red-500" viewBox="0 0 24 24">
            <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
          </svg>
          <span className="hidden sm:inline">찜 취소</span>
        </>
      ) : (
        <>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
          <span className="hidden sm:inline">찜하기</span>
        </>
      )}
    </Button>
  );
}
