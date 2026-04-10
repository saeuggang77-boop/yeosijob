import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { PARTNER_CATEGORIES } from "@/lib/constants/partners";
import { REGIONS } from "@/lib/constants/regions";

export const alt = "여시잡 제휴업체";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const partner = await prisma.partner.findFirst({
    where: { id, status: "ACTIVE", isProfileComplete: true },
    select: {
      name: true,
      category: true,
      region: true,
      highlight: true,
      _count: { select: { partnerReviews: { where: { isHidden: false } } } },
    },
  });

  if (!partner) {
    return new ImageResponse(
      (
        <div
          style={{
            background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ color: "#D4A853", fontSize: 80, fontWeight: 800 }}>여시잡</div>
          <div style={{ color: "#b0b0b0", fontSize: 32, marginTop: 20 }}>제휴업체</div>
        </div>
      ),
      { ...size }
    );
  }

  const categoryInfo = PARTNER_CATEGORIES[partner.category];
  const regionLabel = REGIONS[partner.region]?.label || partner.region;
  const categoryColor = categoryInfo?.color || "#D4A853";

  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "60px 80px",
          justifyContent: "space-between",
        }}
      >
        {/* 상단: 로고 + 카테고리 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ color: "#D4A853", fontSize: 36, fontWeight: 800 }}>여시잡</div>
          <div
            style={{
              background: categoryColor,
              color: "#fff",
              fontSize: 20,
              padding: "8px 20px",
              borderRadius: 8,
            }}
          >
            {categoryInfo?.emoji} {categoryInfo?.label || "제휴업체"}
          </div>
        </div>

        {/* 중앙: 업체명 + 한줄소개 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              color: "#ffffff",
              fontSize: 56,
              fontWeight: 700,
              lineHeight: 1.2,
            }}
          >
            {partner.name.length > 20 ? partner.name.slice(0, 20) + "..." : partner.name}
          </div>
          {partner.highlight && (
            <div style={{ color: "#aaa", fontSize: 26, lineHeight: 1.4 }}>
              {partner.highlight.length > 60
                ? partner.highlight.slice(0, 60) + "..."
                : partner.highlight}
            </div>
          )}
        </div>

        {/* 하단: 지역 + 후기 수 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div
            style={{
              background: "rgba(255,255,255,0.1)",
              color: "#ccc",
              fontSize: 20,
              padding: "8px 16px",
              borderRadius: 8,
            }}
          >
            {regionLabel}
          </div>
          {partner._count.partnerReviews > 0 && (
            <div style={{ color: "#D4A853", fontSize: 20 }}>
              후기 {partner._count.partnerReviews}건
            </div>
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
