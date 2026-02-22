export type DurationDays = 30 | 60 | 90;

export interface AdProduct {
  id: string;
  name: string;
  rank: number;
  required: boolean;
  description: string;
  position: string;
  maxRegions: number;
  autoJumpPerDay: number;
  manualJumpPerDay: number;
  includeResumeView: boolean;
  includeDesignCount: number;
  includeResumeAlert: boolean;
  includeCafeAd: number;
  includeIconFree: boolean;
  resumeViewLimit: number;
  maxEdits: number;
  maxSlots?: number;
  pricing: Record<DurationDays, number>;
  vsQueen: string;
}

export const AD_PRODUCTS: Record<string, AdProduct> = {
  LINE: {
    id: "LINE",
    name: "줄광고",
    rank: 99,
    required: true,
    description: "채용정보 리스트에 기본 노출",
    position: "채용정보 리스트",
    maxRegions: 1,
    autoJumpPerDay: 12,
    manualJumpPerDay: 0,
    includeResumeView: true,
    includeDesignCount: 0,
    includeResumeAlert: false,
    includeCafeAd: 0,
    includeIconFree: false,
    resumeViewLimit: 3,
    maxEdits: 1,
    pricing: { 30: 70_000, 60: 125_000, 90: 170_000 },
    vsQueen: "자동점프 +20%, 이력서열람 기본 포함",
  },

  RECOMMEND: {
    id: "RECOMMEND",
    name: "추천",
    rank: 6,
    required: false,
    description: "메인 하단 추천 영역에 배치",
    position: "메인 하단 추천 영역",
    maxRegions: 2,
    autoJumpPerDay: 24,
    manualJumpPerDay: 3,
    includeResumeView: true,
    includeDesignCount: 0,
    includeResumeAlert: false,
    includeCafeAd: 0,
    includeIconFree: false,
    resumeViewLimit: 3,
    maxEdits: 1,
    pricing: { 30: 100_000, 60: 185_000, 90: 240_000 },
    vsQueen: "자동점프 +20%, 수동점프 3회 추가",
  },

  URGENT: {
    id: "URGENT",
    name: "급구",
    rank: 5,
    required: false,
    description: "메인 좌측 하단, 진한 강조 노출",
    position: "메인 좌측 하단 (강조)",
    maxRegions: 2,
    autoJumpPerDay: 24,
    manualJumpPerDay: 5,
    includeResumeView: true,
    includeDesignCount: 0,
    includeResumeAlert: false,
    includeCafeAd: 0,
    includeIconFree: true,
    resumeViewLimit: 3,
    maxEdits: 1,
    pricing: { 30: 100_000, 60: 185_000, 90: 240_000 },
    vsQueen: "자동점프 +20%, 수동점프 5회, 아이콘 무료(퀸알바 3만원)",
  },

  SPECIAL: {
    id: "SPECIAL",
    name: "스페셜",
    rank: 4,
    required: false,
    description: "채용정보/지역별 페이지 중단 배치",
    position: "채용/지역별 페이지 중단",
    maxRegions: 2,
    autoJumpPerDay: 28,
    manualJumpPerDay: 8,
    includeResumeView: true,
    includeDesignCount: 0,
    includeResumeAlert: false,
    includeCafeAd: 0,
    includeIconFree: false,
    resumeViewLimit: 10,
    maxEdits: 2,
    pricing: { 30: 130_000, 60: 235_000, 90: 310_000 },
    vsQueen: "자동점프 +40%, 수동점프 8회, 수정 2회",
  },

  PREMIUM: {
    id: "PREMIUM",
    name: "프리미엄",
    rank: 3,
    required: false,
    description: "메인 우대 하단 프리미엄 영역 배치",
    position: "메인 우대 하단 (프리미엄 영역)",
    maxRegions: 3,
    autoJumpPerDay: 36,
    manualJumpPerDay: 12,
    includeResumeView: true,
    includeDesignCount: 1,
    includeResumeAlert: true,
    includeCafeAd: 0,
    includeIconFree: false,
    resumeViewLimit: 9999,
    maxEdits: 2,
    pricing: { 30: 180_000, 60: 325_000, 90: 430_000 },
    vsQueen: "자동점프 +20%, 수동점프 12회, 디자인+알림 포함",
  },

  VIP: {
    id: "VIP",
    name: "우대",
    rank: 2,
    required: false,
    description: "메인 중단 최고 위치 배치",
    position: "메인 중단 (최고 위치)",
    maxRegions: 3,
    autoJumpPerDay: 42,
    manualJumpPerDay: 18,
    includeResumeView: true,
    includeDesignCount: 2,
    includeResumeAlert: true,
    includeCafeAd: 1,
    includeIconFree: false,
    resumeViewLimit: 9999,
    maxEdits: 3,
    pricing: { 30: 230_000, 60: 415_000, 90: 550_000 },
    vsQueen: "자동점프 +40%, 수동점프 18회, 카페연동, 수정 3회",
  },

  BANNER: {
    id: "BANNER",
    name: "특수배너",
    rank: 1,
    required: false,
    description: "모든 페이지 최상단 배너 노출",
    position: "사이트 전체 최상단 배너",
    maxRegions: 0,
    autoJumpPerDay: 48,
    manualJumpPerDay: 24,
    includeResumeView: true,
    includeDesignCount: 3,
    includeResumeAlert: true,
    includeCafeAd: 2,
    includeIconFree: true,
    resumeViewLimit: 9999,
    maxEdits: 5,
    maxSlots: 12,
    pricing: { 30: 350_000, 60: 650_000, 90: 900_000 },
    vsQueen: "12건 한정(퀸알바 23건), 카페연동 2회, 수정 5회",
  },
};

export const AD_OPTIONS = {
  BOLD: {
    id: "BOLD",
    name: "굵은글씨",
    description: "제목을 굵게 표시하여 리스트에서 눈에 띄게",
    pricing: { 30: 30_000, 60: 55_000, 90: 70_000 },
  },
  ICON: {
    id: "ICON",
    name: "아이콘",
    description: "10종 아이콘 중 선택하여 리스트에 아이콘 표시",
    choices: 10,
    pricing: { 30: 30_000, 60: 55_000, 90: 70_000 },
  },
  HIGHLIGHT: {
    id: "HIGHLIGHT",
    name: "형광펜",
    description: "8종 형광색 중 선택하여 리스트 배경 강조",
    choices: 8,
    pricing: { 30: 30_000, 60: 55_000, 90: 70_000 },
  },
  KAKAO_ALERT: {
    id: "KAKAO_ALERT",
    name: "카카오 알림톡",
    description: "신규 이력서 등록 시 카카오 알림톡으로 즉시 알림",
    pricing: { 30: 50_000, 60: 90_000, 90: 120_000 },
  },
} as const;
