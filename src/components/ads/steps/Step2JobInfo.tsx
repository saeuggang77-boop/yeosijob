"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { step2Schema } from "@/lib/validators/ad";
import type { AdFormData } from "@/lib/validators/ad";

interface Props {
  data: Partial<AdFormData>;
  onUpdate: (data: Partial<AdFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step2JobInfo({ data, onUpdate, onNext, onBack }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const values = {
      title: formData.get("title") as string,
      salaryText: formData.get("salaryText") as string,
      workHours: formData.get("workHours") as string,
      benefits: formData.get("benefits") as string,
      description: formData.get("description") as string,
    };

    const result = step2Schema.safeParse(values);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0];
        if (typeof path === "string") {
          fieldErrors[path] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    onUpdate(values);
    onNext();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>채용 정보 입력</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">
              채용 제목 <span className="text-destructive">*</span>
              <span className="ml-1 text-xs text-muted-foreground">
                (30자 이내)
              </span>
            </Label>
            <Input
              id="title"
              name="title"
              defaultValue={data.title}
              placeholder="예: 강남 룸싸롱 여성 정직원 모집"
              maxLength={30}
              required
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="salaryText">
              급여 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="salaryText"
              name="salaryText"
              defaultValue={data.salaryText}
              placeholder="예: 시급 15,000~25,000+α"
              required
            />
            {errors.salaryText && (
              <p className="text-xs text-destructive">{errors.salaryText}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="workHours">근무시간 (선택)</Label>
            <Input
              id="workHours"
              name="workHours"
              defaultValue={data.workHours}
              placeholder="예: PM 7:00 ~ AM 3:00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="benefits">혜택/복리후생 (선택)</Label>
            <Textarea
              id="benefits"
              name="benefits"
              defaultValue={data.benefits}
              placeholder="예: 식사 제공, 의상 제공, 택시비 지원"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              상세 설명 <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={data.description}
              placeholder="업소 소개, 근무 조건, 지원 방법 등을 자세히 작성해주세요"
              rows={8}
              required
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description}</p>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onBack}
            >
              이전
            </Button>
            <Button type="submit" className="flex-1">
              다음 단계
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
