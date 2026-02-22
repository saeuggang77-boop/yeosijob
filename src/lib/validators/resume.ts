import { z } from "zod";

const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;

export const resumeSchema = z.object({
  nickname: z.string().min(1, "닉네임을 입력해주세요").max(20, "닉네임은 20자 이내로 입력해주세요"),
  gender: z.enum(["여성", "남성"]),
  age: z.number().min(18, "18세 이상만 등록 가능합니다").max(65, "나이는 65세 이하로 입력해주세요"),
  height: z.number().min(140).max(200).optional(),
  weight: z.number().min(30).max(150).optional(),
  region: z.string().min(1, "희망 지역을 선택해주세요"),
  districts: z.array(z.string()).max(3, "상세 지역은 최대 3개까지 선택 가능합니다"),
  desiredJobs: z.array(z.string()).min(1, "희망 업종을 최소 1개 이상 선택해주세요"),
  experienceLevel: z.enum(["BEGINNER", "UNDER_6M", "6M_TO_1Y", "1Y_TO_3Y", "OVER_3Y"]),
  desiredSalaryType: z.enum(["HOURLY", "DAILY", "MONTHLY", "NEGOTIABLE"]).optional(),
  desiredSalaryAmount: z.number().optional(),
  availableHours: z.string().max(50).optional(),
  kakaoId: z.string().min(1, "카카오톡 ID를 입력해주세요").max(30),
  phone: z.string().regex(phoneRegex, "올바른 전화번호 형식이 아닙니다").optional().or(z.literal("")),
  title: z.string().min(1, "제목을 입력해주세요").max(30, "제목은 30자 이내로 입력해주세요"),
  introduction: z.string().min(1, "자기소개를 입력해주세요").max(500, "자기소개는 500자 이내로 입력해주세요"),
  photoUrl: z.string().optional(),
  isPublic: z.boolean(),
});

export type ResumeFormData = z.infer<typeof resumeSchema>;
