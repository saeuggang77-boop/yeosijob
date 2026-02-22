/**
 * 카카오 알림톡 템플릿 정의
 * Phase 3 Item 29
 */

/**
 * 템플릿 ID 상수
 */
export const KAKAO_TEMPLATES = {
  /** 이력서 등록 알림 */
  NEW_RESUME: "TEMPLATE_NEW_RESUME",
  /** 광고 승인 알림 */
  AD_APPROVED: "TEMPLATE_AD_APPROVED",
  /** 광고 만료 임박 알림 */
  AD_EXPIRING: "TEMPLATE_AD_EXPIRING",
} as const;

/**
 * 이력서 등록 알림 변수
 */
export interface NewResumeVariables {
  /** 업소명 */
  businessName: string;
  /** 구직자 닉네임 */
  nickname: string;
  /** 희망 지역 */
  region: string;
  /** 이력서 링크 */
  link: string;
}

/**
 * 광고 승인 알림 변수
 */
export interface AdApprovedVariables {
  /** 업소명 */
  businessName: string;
  /** 광고 제목 */
  title: string;
  /** 시작일 */
  startDate: string;
  /** 종료일 */
  endDate: string;
}

/**
 * 광고 만료 임박 알림 변수
 */
export interface AdExpiringVariables {
  /** 업소명 */
  businessName: string;
  /** 광고 제목 */
  title: string;
  /** 종료일 */
  endDate: string;
  /** 남은 일수 */
  daysLeft: string;
}
