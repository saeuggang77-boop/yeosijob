export const EXPERIENCE_LEVELS = [
  { value: "BEGINNER", label: "초보(경험없음)" },
  { value: "UNDER_6M", label: "6개월 미만" },
  { value: "6M_TO_1Y", label: "6개월~1년" },
  { value: "1Y_TO_3Y", label: "1년~3년" },
  { value: "OVER_3Y", label: "3년 이상" },
] as const;

export type ExperienceLevelValue = (typeof EXPERIENCE_LEVELS)[number]["value"];

export const SALARY_TYPES = [
  { value: "HOURLY", label: "시급" },
  { value: "DAILY", label: "일급" },
  { value: "MONTHLY", label: "월급" },
  { value: "NEGOTIABLE", label: "면접후협의" },
] as const;

export type SalaryTypeValue = (typeof SALARY_TYPES)[number]["value"];

export const GENDER_OPTIONS = [
  { value: "여성", label: "여성" },
  { value: "남성", label: "남성" },
] as const;

export const BODY_TYPES = [
  { value: "SLIM", label: "슬림" },
  { value: "NORMAL", label: "보통" },
  { value: "GLAMOUR", label: "글래머" },
  { value: "HEALTHY", label: "건강미" },
] as const;

export type BodyTypeValue = (typeof BODY_TYPES)[number]["value"];

