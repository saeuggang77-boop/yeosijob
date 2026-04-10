import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { REGIONS } from "@/lib/constants/regions";
import { BUSINESS_TYPES } from "@/lib/constants/business-types";
import type { Region } from "@/generated/prisma/client";

export const alt = "여시잡 채용정보";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const ad = await prisma.ad.findUnique({
    where: { id },
    select: {
      title: true,
      businessName: true,
      regions: true,
      businessType: true,
      salaryText: true,
      status: true,
    },
  });

  if (!ad || ad.status !== "ACTIVE") {
    // Fallback: 기본 OG 이미지
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
          <div style={{ color: "#b0b0b0", fontSize: 32, marginTop: 20 }}>
            유흥알바 밤알바 룸알바 No.1 구인구직
          </div>
        </div>
      ),
      { ...size }
    );
  }

  const regionLabel = ad.regions
    .map((r: Region) => REGIONS[r]?.label || r)
    .join(", ");
  const bizLabel = BUSINESS_TYPES[ad.businessType]?.label || ad.businessType;

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
              background: "rgba(212,168,83,0.15)",
              color: "#D4A853",
              fontSize: 20,
              padding: "8px 20px",
              borderRadius: 8,
            }}
          >
            {bizLabel}
          </div>
        </div>

        {/* 중앙: 제목 + 업체명 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              color: "#ffffff",
              fontSize: 52,
              fontWeight: 700,
              lineHeight: 1.2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {ad.title.length > 40 ? ad.title.slice(0, 40) + "..." : ad.title}
          </div>
          <div style={{ color: "#999", fontSize: 28 }}>{ad.businessName}</div>
        </div>

        {/* 하단: 지역 + 급여 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
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
          </div>
          {ad.salaryText && (
            <div style={{ color: "#D4A853", fontSize: 24, fontWeight: 600 }}>
              {ad.salaryText}
            </div>
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
