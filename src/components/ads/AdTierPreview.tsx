export function AdTierPreview() {
  const tiers = [
    { id: "LINE", label: "줄광고", price: "7만원/30일", style: "border bg-card", desc: "기본 텍스트 노출" },
    { id: "RECOMMEND", label: "추천", price: "10만원/30일", style: "border-l-4 border-l-recommend bg-card", desc: "블루 강조 + 추천섹션" },
    { id: "URGENT", label: "급구", price: "15만원/30일", style: "border-l-4 border-l-urgent bg-urgent/5", desc: "빨간 급구뱃지 + 펄스" },
    { id: "SPECIAL", label: "스페셜", price: "20만원/30일", style: "border-t-2 border-t-special bg-special/5", desc: "퍼플 강조 + 상단 노출" },
    { id: "PREMIUM", label: "프리미엄", price: "30만원/30일", style: "border border-primary/50 bg-primary/5", desc: "골드 테두리 + 카드 노출" },
    { id: "VIP", label: "VIP", price: "50만원/30일", style: "border border-primary bg-gradient-to-r from-primary/10 to-accent/10", desc: "최상단 골드 카드 노출" },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {tiers.map((t) => (
        <div key={t.id} className={`rounded-lg p-4 ${t.style}`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold">{t.label}</span>
            <span className="text-xs font-medium text-primary">{t.price}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{t.desc}</p>
        </div>
      ))}
    </div>
  );
}
