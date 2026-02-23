import { AD_PRODUCTS } from "@/lib/constants/products";

export function AdTierPreview() {
  const formatPrice = (amount: number): string => {
    if (amount === 0) return "0원";
    return `${(amount / 10000).toLocaleString()}만원/30일`;
  };

  // Order: BANNER → VIP → PREMIUM → SPECIAL → URGENT → RECOMMEND → LINE → FREE
  const tierOrder = ["BANNER", "VIP", "PREMIUM", "SPECIAL", "URGENT", "RECOMMEND", "LINE", "FREE"];

  const tiers = tierOrder.map((id) => {
    const product = AD_PRODUCTS[id];
    return {
      id: product.id,
      label: product.name,
      price: formatPrice(product.pricing[30]),
      style: getStyleForTier(product.id),
      desc: product.description,
    };
  });

  function getStyleForTier(id: string): string {
    switch (id) {
      case "BANNER":
        return "border-2 border-primary bg-gradient-to-r from-primary/15 to-accent/10";
      case "VIP":
        return "border border-primary bg-gradient-to-r from-primary/10 to-accent/10";
      case "PREMIUM":
        return "border border-primary/50 bg-primary/5";
      case "SPECIAL":
        return "border-t-2 border-t-special bg-special/5";
      case "URGENT":
        return "border-l-4 border-l-urgent bg-urgent/5";
      case "RECOMMEND":
        return "border-l-4 border-l-recommend bg-card";
      case "LINE":
        return "border bg-card";
      case "FREE":
        return "border bg-muted/30";
      default:
        return "border bg-card";
    }
  }

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
