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

    const businessName = searchParams.get("n") || "업소명";
    const businessTypeKey = searchParams.get("t") || "";
    const regionsParam = searchParams.get("r") || "";
    const salaryText = searchParams.get("s") || "급여 협의";
    const bannerColor = Number(searchParams.get("c")) || 0;

    const design = getBannerDesign(id, bannerColor);

    const businessType = BUSINESS_TYPES[businessTypeKey as BusinessTypeKey];
    const businessLabel = businessType?.label || "기타";
    const businessIcon = businessType?.icon || "📋";

    const regionLabels = regionsParam
      ? regionsParam
          .split(",")
          .map((r) => REGIONS[r as RegionKey]?.shortLabel)
          .filter(Boolean)
          .join(" · ")
      : "";

    // 반응형 폰트 크기
    const base = Math.min(width, height) / 10;
    const lg = Math.round(base * 1.8);
    const md = Math.round(base * 1.2);
    const sm = Math.round(base * 0.7);

    // 메인 컬러에서 rgba 추출 (satori 호환)
    const mc = hexToRgb(design.color.main);
    const sc = hexToRgb(design.color.sub);

    // 배경 스타일 (satori 안전한 단일 linear-gradient만 사용)
    const bgStyle = getBackground(design.patternIndex, mc, design.color.bg);

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            background: bgStyle,
          }}
        >
          {/* 컨텐츠 */}
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "24px 32px",
            }}
          >
            {/* 업종 + 지역 라인 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  background: `rgba(${mc.r},${mc.g},${mc.b},0.15)`,
                  color: design.color.main,
                  padding: "4px 12px",
                  borderRadius: "12px",
                  fontSize: sm,
                  fontWeight: 600,
                  display: "flex",
                }}
              >
                {businessIcon} {businessLabel}
              </div>
              {regionLabels && (
                <div
                  style={{
                    color: design.color.sub,
                    fontSize: sm,
                    marginLeft: "10px",
                    display: "flex",
                  }}
                >
                  {regionLabels}
                </div>
              )}
            </div>

            {/* 업소명 */}
            <div
              style={{
                fontSize: lg,
                fontWeight: 800,
                color: design.color.main,
                lineHeight: 1.2,
                marginBottom: "8px",
                display: "flex",
              }}
            >
              {businessName}
            </div>

            {/* 급여 */}
            <div
              style={{
                fontSize: md,
                fontWeight: 700,
                color: `rgba(${sc.r},${sc.g},${sc.b},0.9)`,
                display: "flex",
              }}
            >
              {salaryText}
            </div>
          </div>

          {/* 우측 장식 라인 */}
          <div
            style={{
              width: "6px",
              height: "100%",
              background: `linear-gradient(to bottom, ${design.color.main}, ${design.color.sub})`,
              display: "flex",
            }}
          />
        </div>
      ),
      { width, height }
    );
  } catch (error) {
    console.error("Banner generation error:", error);
    return new Response("Banner error", { status: 500 });
  }
}

/** hex → {r,g,b} */
function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

/** satori 호환 배경 (단일 linear-gradient만 사용) */
function getBackground(patternIndex: number, mc: { r: number; g: number; b: number }, bg: string) {
  const a = `rgba(${mc.r},${mc.g},${mc.b}`;
  switch (patternIndex % 8) {
    case 0:
      return `linear-gradient(135deg, ${bg} 0%, ${a},0.06) 50%, ${bg} 100%)`;
    case 1:
      return `linear-gradient(160deg, ${a},0.08) 0%, ${bg} 40%, ${bg} 60%, ${a},0.04) 100%)`;
    case 2:
      return `linear-gradient(45deg, ${bg} 0%, ${a},0.05) 30%, ${bg} 50%, ${a},0.08) 80%, ${bg} 100%)`;
    case 3:
      return `linear-gradient(180deg, ${a},0.1) 0%, ${bg} 30%, ${bg} 70%, ${a},0.05) 100%)`;
    case 4:
      return `linear-gradient(to right, ${a},0.08) 0%, ${bg} 25%, ${bg} 75%, ${a},0.06) 100%)`;
    case 5:
      return `linear-gradient(135deg, ${a},0.1) 0%, ${bg} 35%, ${a},0.03) 65%, ${bg} 100%)`;
    case 6:
      return `linear-gradient(to bottom, ${bg} 0%, ${a},0.06) 100%)`;
    case 7:
      return `linear-gradient(225deg, ${a},0.08) 0%, ${bg} 40%, ${a},0.04) 100%)`;
    default:
      return bg;
  }
}
