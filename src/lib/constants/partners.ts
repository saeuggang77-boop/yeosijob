export const PARTNER_GRADES = {
  A: { label: "A등급", price: 3_000_000, mainExposure: true, color: "#D4A853", description: "메인 최상단 골드 카드" },
  B: { label: "B등급", price: 2_000_000, mainExposure: true, color: "#9CA3AF", description: "메인 실버 카드" },
  C: { label: "C등급", price: 1_000_000, mainExposure: true, color: "#78716C", description: "메인 일반 카드" },
  D: { label: "D등급", price: 500_000, mainExposure: false, color: "#444", description: "/partner 페이지만 노출" },
} as const;

export const PARTNER_CATEGORIES = {
  PLASTIC_SURGERY: { label: "성형/시술", emoji: "💉", color: "#a855f7" },
  BEAUTY: { label: "미용/네일", emoji: "💇", color: "#ec4899" },
  RENTAL: { label: "렌탈", emoji: "👗", color: "#3b82f6" },
  FINANCE: { label: "금융", emoji: "💰", color: "#eab308" },
  OTHER: { label: "기타", emoji: "📦", color: "#6b7280" },
} as const;

export const PARTNER_STATUS_LABELS: Record<string, { label: string; variant: string }> = {
  PENDING_PAYMENT: { label: "결제대기", variant: "warning" },
  ACTIVE: { label: "활성", variant: "success" },
  EXPIRED: { label: "만료", variant: "destructive" },
  CANCELLED: { label: "취소", variant: "secondary" },
};
