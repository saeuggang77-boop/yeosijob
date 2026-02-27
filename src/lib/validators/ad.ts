import { z } from "zod/v4";

export const step1Schema = z.object({
  businessName: z.string().min(1, "업소명을 입력해주세요"),
  businessType: z.string().min(1, "업종을 선택해주세요"),
  contactPhone: z
    .string()
    .regex(/^01[016789]\d{7,8}$/, "올바른 연락처를 입력해주세요"),
  contactKakao: z.string().optional(),
  contactTelegram: z.string().optional(),
  address: z.string().min(1, "주소를 입력해주세요"),
  addressDetail: z.string().optional(),
  bannerColor: z.number().min(0).max(14).default(0),
  bannerTitle: z.string().max(12, "배너 문구는 12자 이내로 입력해주세요").optional(),
  bannerSubtitle: z.string().max(40, "서브카피는 40자 이내로 입력해주세요").optional(),
  bannerTemplate: z.number().min(0).max(29).default(0),
});

export const step2Schema = z.object({
  title: z
    .string()
    .min(1, "채용 제목을 입력해주세요")
    .max(30, "채용 제목은 30자 이내로 입력해주세요"),
  salaryText: z.string().min(1, "급여를 입력해주세요"),
  workHours: z.string().optional(),
  benefits: z.string().optional(),
  description: z.string().min(10, "상세 설명은 10자 이상 입력해주세요"),
});

export const step3Schema = z.object({
  regions: z.array(z.string()).min(1, "노출 지역을 선택해주세요"),
  durationDays: z.number().refine((v) => [0, 30, 60, 90].includes(v), {
    message: "기간을 선택해주세요",
  }),
  productId: z.string().min(1, "상품을 선택해주세요"),
  options: z.array(z.string()).optional(),
});

export type Step1Data = z.infer<typeof step1Schema>;
export type Step2Data = z.infer<typeof step2Schema>;
export type Step3Data = z.infer<typeof step3Schema>;

export interface AdFormData extends Step1Data, Step2Data, Step3Data {
  optionValues?: Record<string, string>;
}
