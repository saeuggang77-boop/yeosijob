import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getBannerDesign } from "@/lib/constants/banner-themes";
import { BUSINESS_TYPES, type BusinessTypeKey } from "@/lib/constants/business-types";
import { REGIONS, type RegionKey } from "@/lib/constants/regions";

export const runtime = "edge";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);

    const width = Math.max(100, Math.min(1200, Number(searchParams.get("w")) || 600));
    const height = Math.max(100, Math.min(1200, Number(searchParams.get("h")) || 200));
    const businessName = searchParams.get("n") || "";
    const businessTypeKey = searchParams.get("t") || "";
    const regionsParam = searchParams.get("r") || "";
    const salaryText = searchParams.get("s") || "";
    const bannerColor = Number(searchParams.get("c")) || 0;

    const design = getBannerDesign(id, bannerColor);
    const mc = hexToRgb(design.color.main);
    const sc = hexToRgb(design.color.sub);

    const businessType = BUSINESS_TYPES[businessTypeKey as BusinessTypeKey];
    const businessLabel = businessType?.label || "";
    const businessIcon = businessType?.icon || "";

    const regionLabels = regionsParam
      ? regionsParam
          .split(",")
          .map((r) => REGIONS[r as RegionKey]?.shortLabel)
          .filter(Boolean)
          .join(" · ")
      : "";

    // 반응형 폰트 크기
    const base = Math.min(width, height) / 10;
    const lg = Math.round(base * 2);
    const md = Math.round(base * 1.3);
    const sm = Math.round(base * 0.8);

    const bgStyle = getBackground(design.patternIndex, mc, design.color.bg);
    const accentBg = getAccent(design.layoutIndex, mc, sc);

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            background: bgStyle,
            fontFamily: "sans-serif",
          }}
        >
          {/* 우측 장식 그라데이션 */}
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "45%",
              height: "100%",
              background: accentBg,
              display: "flex",
            }}
          />

          {/* 하단 액센트 라인 */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: "100%",
              height: "3px",
              background: `linear-gradient(to right, ${design.color.main}, ${design.color.sub}, transparent)`,
              display: "flex",
            }}
          />

          {/* 컨텐츠 */}
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: `${Math.round(height * 0.12)}px ${Math.round(width * 0.05)}px`,
            }}
          >
            {/* 업종 + 지역 */}
            {(businessLabel || regionLabels) && (
              <div style={{ display: "flex", alignItems: "center", marginBottom: `${Math.round(base * 0.6)}px` }}>
                {businessLabel && (
                  <div
                    style={{
                      background: `rgba(${mc.r},${mc.g},${mc.b},0.2)`,
                      color: design.color.main,
                      padding: `${Math.round(base * 0.3)}px ${Math.round(base * 0.8)}px`,
                      borderRadius: `${Math.round(base * 0.5)}px`,
                      fontSize: sm,
                      fontWeight: 600,
                      display: "flex",
                    }}
                  >
                    {businessIcon} {businessLabel}
                  </div>
                )}
                {regionLabels && (
                  <div
                    style={{
                      color: `rgba(${sc.r},${sc.g},${sc.b},0.8)`,
                      fontSize: sm,
                      marginLeft: `${Math.round(base * 0.6)}px`,
                      display: "flex",
                    }}
                  >
                    {regionLabels}
                  </div>
                )}
              </div>
            )}

            {/* 업소명 */}
            {businessName && (
              <div
                style={{
                  fontSize: lg,
                  fontWeight: 800,
                  color: design.color.main,
                  lineHeight: 1.2,
                  display: "flex",
                }}
              >
                {businessName}
              </div>
            )}

            {/* 급여 */}
            {salaryText && (
              <div
                style={{
                  fontSize: md,
                  fontWeight: 700,
                  color: "#ffffff",
                  marginTop: `${Math.round(base * 0.5)}px`,
                  display: "flex",
                }}
              >
                {salaryText}
              </div>
            )}
          </div>
        </div>
      ),
      {
        width,
        height,
        headers: { "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800" },
      }
    );
  } catch (error) {
    console.error("Banner generation error:", error);
    return new Response("Banner error", { status: 500 });
  }
}

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

function getBackground(idx: number, mc: { r: number; g: number; b: number }, bg: string) {
  const a = `rgba(${mc.r},${mc.g},${mc.b}`;
  switch (idx % 8) {
    case 0: return `linear-gradient(135deg, ${bg} 0%, ${a},0.08) 50%, ${bg} 100%)`;
    case 1: return `linear-gradient(160deg, ${a},0.1) 0%, ${bg} 40%, ${a},0.04) 100%)`;
    case 2: return `linear-gradient(45deg, ${bg} 0%, ${a},0.06) 30%, ${bg} 70%, ${a},0.1) 100%)`;
    case 3: return `linear-gradient(180deg, ${a},0.12) 0%, ${bg} 35%, ${a},0.05) 100%)`;
    case 4: return `linear-gradient(to right, ${a},0.1) 0%, ${bg} 30%, ${bg} 70%, ${a},0.08) 100%)`;
    case 5: return `linear-gradient(135deg, ${a},0.12) 0%, ${bg} 40%, ${a},0.04) 70%, ${bg} 100%)`;
    case 6: return `linear-gradient(to bottom, ${bg} 0%, ${a},0.08) 50%, ${bg} 100%)`;
    case 7: return `linear-gradient(225deg, ${a},0.1) 0%, ${bg} 45%, ${a},0.06) 100%)`;
    default: return bg;
  }
}

function getAccent(idx: number, mc: { r: number; g: number; b: number }, sc: { r: number; g: number; b: number }) {
  const a = `rgba(${mc.r},${mc.g},${mc.b}`;
  const b = `rgba(${sc.r},${sc.g},${sc.b}`;
  switch (idx % 6) {
    case 0: return `linear-gradient(to left, ${a},0.12) 0%, transparent 80%)`;
    case 1: return `linear-gradient(135deg, transparent 30%, ${a},0.08) 100%)`;
    case 2: return `linear-gradient(to left, ${b},0.1) 0%, transparent 60%)`;
    case 3: return `linear-gradient(180deg, ${a},0.06) 0%, transparent 50%, ${b},0.08) 100%)`;
    case 4: return `linear-gradient(225deg, ${a},0.1) 0%, transparent 70%)`;
    case 5: return `linear-gradient(to left, ${b},0.06) 0%, ${a},0.04) 40%, transparent 80%)`;
    default: return "transparent";
  }
}
