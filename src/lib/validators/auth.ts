import { z } from "zod/v4";

export const loginSchema = z.object({
  email: z.email("올바른 이메일을 입력해주세요"),
  password: z.string().min(6, "비밀번호는 6자 이상이어야 합니다"),
});

export const registerJobseekerSchema = z
  .object({
    name: z.string().min(2, "이름은 2자 이상이어야 합니다"),
    email: z.email("올바른 이메일을 입력해주세요"),
    phone: z
      .string()
      .regex(/^01[016789]\d{7,8}$/, "올바른 휴대폰 번호를 입력해주세요"),
    password: z.string().min(6, "비밀번호는 6자 이상이어야 합니다"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다",
    path: ["confirmPassword"],
  });

export const registerBusinessSchema = z
  .object({
    name: z.string().min(2, "담당자명은 2자 이상이어야 합니다"),
    email: z.email("올바른 이메일을 입력해주세요"),
    phone: z
      .string()
      .regex(/^01[016789]\d{7,8}$/, "올바른 휴대폰 번호를 입력해주세요"),
    password: z.string().min(6, "비밀번호는 6자 이상이어야 합니다"),
    confirmPassword: z.string(),
    businessName: z.string().min(1, "업소명을 입력해주세요"),
    businessNumber: z
      .string()
      .regex(/^\d{10}$/, "사업자등록번호 10자리를 입력해주세요"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterJobseekerInput = z.infer<typeof registerJobseekerSchema>;
export type RegisterBusinessInput = z.infer<typeof registerBusinessSchema>;
