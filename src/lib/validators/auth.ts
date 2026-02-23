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

export const forgotPasswordSchema = z.object({
  email: z.email("올바른 이메일을 입력해주세요"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "토큰이 필요합니다"),
    password: z.string().min(6, "비밀번호는 6자 이상이어야 합니다"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "현재 비밀번호를 입력해주세요"),
    newPassword: z.string().min(6, "새 비밀번호는 6자 이상이어야 합니다"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "현재 비밀번호와 다른 비밀번호를 입력해주세요",
    path: ["newPassword"],
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다",
    path: ["confirmPassword"],
  });

export const updateProfileSchema = z.object({
  name: z.string().min(2, "이름은 2자 이상이어야 합니다"),
  phone: z
    .string()
    .regex(/^01[016789]\d{7,8}$/, "올바른 휴대폰 번호를 입력해주세요")
    .optional()
    .or(z.literal("")),
  businessName: z.string().min(1, "업소명을 입력해주세요").optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type RegisterJobseekerInput = z.infer<typeof registerJobseekerSchema>;
export type RegisterBusinessInput = z.infer<typeof registerBusinessSchema>;
