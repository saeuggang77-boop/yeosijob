"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SpamWord {
  id: string;
  word: string;
  createdAt: string;
  admin: {
    name: string;
  };
}

export default function SpamPage() {
  const [spamWords, setSpamWords] = useState<SpamWord[]>([]);
  const [newWord, setNewWord] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSpamWords();
  }, []);

  async function fetchSpamWords() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/spam");
      if (res.ok) {
        const data = await res.json();
        setSpamWords(data.spamWords);
      } else {
        alert("스팸 단어 목록을 불러오는데 실패했습니다");
      }
    } catch (error) {
      console.error("Failed to fetch spam words:", error);
      alert("서버 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!newWord.trim()) {
      alert("단어를 입력해주세요");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/admin/spam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: newWord.trim() }),
      });

      if (res.ok) {
        setNewWord("");
        await fetchSpamWords();
        alert("스팸 단어가 추가되었습니다");
      } else {
        const data = await res.json();
        alert(data.error || "추가에 실패했습니다");
      }
    } catch (error) {
      console.error("Failed to add spam word:", error);
      alert("서버 오류가 발생했습니다");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("정말 삭제하시겠습니까?")) {
      return;
    }

    try {
      const res = await fetch("/api/admin/spam", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        await fetchSpamWords();
        alert("스팸 단어가 삭제되었습니다");
      } else {
        alert("삭제에 실패했습니다");
      }
    } catch (error) {
      console.error("Failed to delete spam word:", error);
      alert("서버 오류가 발생했습니다");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">스팸 필터 관리</h1>

      <Card>
        <CardHeader>
          <CardTitle>스팸 단어 추가</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <input
              type="text"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              placeholder="금지할 단어 입력"
              className="flex-1 px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4A853]"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAdd();
                }
              }}
              disabled={submitting}
            />
            <Button
              onClick={handleAdd}
              disabled={submitting}
              className="bg-[#D4A853] hover:bg-[#C49843] text-black"
            >
              {submitting ? "추가 중..." : "추가"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>등록된 스팸 단어 ({spamWords.length}개)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">로딩 중...</p>
          ) : spamWords.length === 0 ? (
            <p className="text-muted-foreground">등록된 스팸 단어가 없습니다</p>
          ) : (
            <div className="space-y-2">
              {spamWords.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border border-border rounded-md bg-card"
                >
                  <div className="flex-1">
                    <span className="font-semibold text-[#D4A853]">{item.word}</span>
                    <span className="ml-4 text-sm text-muted-foreground">
                      등록: {new Date(item.createdAt).toLocaleDateString("ko-KR")} |
                      등록자: {item.admin.name}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    삭제
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
