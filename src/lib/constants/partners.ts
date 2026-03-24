// ── 업종별 가격 (리뉴얼: 등급 폐기 → 업종별 단일 가격) ──

export const PARTNER_CATEGORY_PRICES: Record<string, number> = {
  PLASTIC_SURGERY: 2_000_000,
  FINANCE: 1_000_000,
  BEAUTY: 500_000,
  RENTAL: 500_000,
  OTHER: 500_000,
};

export const PARTNER_DURATION_OPTIONS = [
  { days: 30, label: "30일", discount: 0 },
  { days: 90, label: "90일 (10% 할인)", discount: 0.1 },
  { days: 180, label: "180일 (20% 할인)", discount: 0.2 },
] as const;

/** 업종 + 기간으로 최종 결제 금액 계산 */
export function calculatePartnerPrice(category: string, durationDays: number): number {
  const baseMonthly = PARTNER_CATEGORY_PRICES[category] || 500_000;
  const option = PARTNER_DURATION_OPTIONS.find((o) => o.days === durationDays);
  if (!option) return baseMonthly;

  const months = durationDays / 30;
  const total = baseMonthly * months;
  return Math.round(total * (1 - option.discount));
}

// ── 카테고리 정보 ──

export const PARTNER_CATEGORIES = {
  PLASTIC_SURGERY: { label: "성형/시술", emoji: "💉", color: "#a855f7", price: 2_000_000 },
  BEAUTY: { label: "미용/네일", emoji: "💇", color: "#ec4899", price: 500_000 },
  RENTAL: { label: "렌탈", emoji: "👗", color: "#3b82f6", price: 500_000 },
  FINANCE: { label: "금융", emoji: "💰", color: "#eab308", price: 1_000_000 },
  OTHER: { label: "기타", emoji: "📦", color: "#6b7280", price: 500_000 },
} as const;

// ── 상태 라벨 ──

export const PARTNER_STATUS_LABELS: Record<string, { label: string; variant: string }> = {
  PENDING_PAYMENT: { label: "결제대기", variant: "warning" },
  ACTIVE: { label: "활성", variant: "success" },
  EXPIRED: { label: "만료", variant: "destructive" },
  CANCELLED: { label: "취소", variant: "secondary" },
};

// ── 레거시 등급 (기존 데이터 호환용, 신규 등록에는 미사용) ──

export const PARTNER_GRADES = {
  A: { label: "A등급", price: 3_000_000, mainExposure: true, color: "#D4A853", description: "메인 최상단 골드 카드" },
  B: { label: "B등급", price: 2_000_000, mainExposure: true, color: "#9CA3AF", description: "메인 실버 카드" },
  C: { label: "C등급", price: 1_000_000, mainExposure: true, color: "#78716C", description: "메인 일반 카드" },
  D: { label: "D등급", price: 500_000, mainExposure: false, color: "#444", description: "/partner 페이지만 노출" },
} as const;
