import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getBannerDesign, type BannerPattern, type BannerLayout } from "@/lib/constants/banner-themes";
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

    // 너비/높이 파라미터 (기본값 600x200, 최소 100, 최대 1200)
    const width = Math.max(100, Math.min(1200, Number(searchParams.get("w")) || 600));
    const height = Math.max(100, Math.min(1200, Number(searchParams.get("h")) || 200));

    // URL 파라미터에서 광고 정보 읽기 (DB 조회 없이)
    const businessName = searchParams.get("n") || "업소명";
    const businessTypeKey = searchParams.get("t") || "";
    const regionsParam = searchParams.get("r") || "";
    const salaryText = searchParams.get("s") || "급여 협의";
    const bannerColor = Number(searchParams.get("c")) || 0;

    // 배너 디자인 결정 (ad.id 해시 기반)
    const design = getBannerDesign(id, bannerColor);

    // 업종 정보
    const businessType = BUSINESS_TYPES[businessTypeKey as BusinessTypeKey];
    const businessLabel = businessType?.label || "기타";
    const businessIcon = businessType?.icon || "📋";

    // 지역 정보
    const regionLabels = regionsParam
      ? regionsParam
          .split(",")
          .map((r) => REGIONS[r as RegionKey]?.shortLabel)
          .filter(Boolean)
          .join("·")
      : "";

    // 배경 패턴 생성
    const patternStyle = getPatternStyle(design.pattern, design.color.main, design.color.bg);

    // 레이아웃별 JSX
    const content = renderLayout(
      design.layout,
      {
        businessName,
        businessLabel,
        businessIcon,
        regionLabels,
        salaryText,
        color: design.color,
        width,
        height,
      }
    );

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            position: "relative",
            overflow: "hidden",
            background: design.color.bg,
            ...patternStyle,
          }}
        >
          {content}
        </div>
      ),
      {
        width,
        height,
        headers: {
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        },
      }
    );
  } catch (error) {
    console.error("Banner generation error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}

/** 배경 패턴 스타일 생성 */
function getPatternStyle(pattern: BannerPattern, mainColor: string, bgColor: string) {
  const style: Record<string, string> = {};

  switch (pattern) {
    case "gradient-radial":
      style.background = `radial-gradient(circle at center, ${mainColor}15 0%, ${bgColor} 70%)`;
      break;

    case "diagonal-stripes":
      style.backgroundImage = `repeating-linear-gradient(45deg, ${mainColor}08, ${mainColor}08 10px, transparent 10px, transparent 20px)`;
      break;

    case "dots":
      style.backgroundImage = `radial-gradient(circle, ${mainColor}10 1px, transparent 1px)`;
      style.backgroundSize = "20px 20px";
      break;

    case "waves":
      style.background = `linear-gradient(135deg, ${bgColor} 0%, ${mainColor}08 25%, ${bgColor} 50%, ${mainColor}08 75%, ${bgColor} 100%)`;
      break;

    case "grid":
      style.backgroundImage = `linear-gradient(${mainColor}08 1px, transparent 1px), linear-gradient(90deg, ${mainColor}08 1px, transparent 1px)`;
      style.backgroundSize = "30px 30px";
      break;

    case "diamond":
      style.backgroundImage = `repeating-linear-gradient(45deg, transparent, transparent 10px, ${mainColor}06 10px, ${mainColor}06 20px), repeating-linear-gradient(-45deg, transparent, transparent 10px, ${mainColor}06 10px, ${mainColor}06 20px)`;
      break;

    case "circles":
      style.backgroundImage = `radial-gradient(circle at 20% 30%, ${mainColor}10 0%, transparent 50%), radial-gradient(circle at 80% 70%, ${mainColor}10 0%, transparent 50%)`;
      break;

    case "chevron":
      style.backgroundImage = `repeating-linear-gradient(45deg, transparent, transparent 20px, ${mainColor}06 20px, ${mainColor}06 40px), repeating-linear-gradient(-45deg, transparent, transparent 20px, ${mainColor}06 20px, ${mainColor}06 40px)`;
      break;

    case "noise":
      style.backgroundImage = `radial-gradient(circle, ${mainColor}05 0.5px, transparent 0.5px)`;
      style.backgroundSize = "4px 4px";
      break;

    case "spotlight":
      style.background = `radial-gradient(ellipse at top left, ${mainColor}20 0%, transparent 50%), ${bgColor}`;
      break;

    case "corner-glow":
      style.backgroundImage = `radial-gradient(circle at top right, ${mainColor}15 0%, transparent 40%), radial-gradient(circle at bottom left, ${mainColor}15 0%, transparent 40%)`;
      break;

    case "horizontal-lines":
      style.backgroundImage = `repeating-linear-gradient(0deg, ${mainColor}05, ${mainColor}05 1px, transparent 1px, transparent 8px)`;
      break;

    case "cross-hatch":
      style.backgroundImage = `linear-gradient(${mainColor}05 1px, transparent 1px), linear-gradient(90deg, ${mainColor}05 1px, transparent 1px), linear-gradient(45deg, ${mainColor}03 1px, transparent 1px), linear-gradient(-45deg, ${mainColor}03 1px, transparent 1px)`;
      style.backgroundSize = "20px 20px, 20px 20px, 15px 15px, 15px 15px";
      break;

    case "bokeh":
      style.backgroundImage = `radial-gradient(circle at 15% 20%, ${mainColor}12 0%, transparent 30%), radial-gradient(circle at 75% 60%, ${mainColor}10 0%, transparent 35%), radial-gradient(circle at 50% 80%, ${mainColor}08 0%, transparent 25%)`;
      break;

    case "vignette":
      style.background = `radial-gradient(ellipse at center, ${bgColor} 0%, ${bgColor}dd 60%, ${bgColor}aa 100%)`;
      break;

    default:
      style.background = bgColor;
  }

  return style;
}

/** 레이아웃별 JSX 렌더링 */
function renderLayout(
  layout: BannerLayout,
  data: {
    businessName: string;
    businessLabel: string;
    businessIcon: string;
    regionLabels: string;
    salaryText: string;
    color: { main: string; sub: string; bg: string };
    width: number;
    height: number;
  }
) {
  const { businessName, businessLabel, businessIcon, regionLabels, salaryText, color, width, height } = data;

  // 반응형 폰트 크기 계산
  const baseFontSize = Math.min(width, height) / 10;
  const largeFontSize = baseFontSize * 1.8;
  const mediumFontSize = baseFontSize * 1.2;
  const smallFontSize = baseFontSize * 0.7;

  switch (layout) {
    case "centered":
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "30px",
            gap: "15px",
          }}
        >
          <div
            style={{
              fontSize: largeFontSize,
              fontWeight: 800,
              color: color.main,
              textAlign: "center",
              lineHeight: 1.2,
            }}
          >
            {businessName}
          </div>
          <div
            style={{
              fontSize: smallFontSize,
              color: color.sub,
              display: "flex",
              gap: "10px",
            }}
          >
            <span>{businessIcon} {businessLabel}</span>
            {regionLabels && <span>· {regionLabels}</span>}
          </div>
          <div
            style={{
              fontSize: mediumFontSize,
              fontWeight: 700,
              color: "#ffffff",
              marginTop: "10px",
            }}
          >
            {salaryText}
          </div>
        </div>
      );

    case "left-aligned":
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "30px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "60%" }}>
            <div style={{ fontSize: largeFontSize * 0.8, opacity: 0.8 }}>
              {businessIcon}
            </div>
            <div
              style={{
                fontSize: mediumFontSize,
                fontWeight: 700,
                color: color.main,
                lineHeight: 1.2,
              }}
            >
              {businessName}
            </div>
            <div style={{ fontSize: smallFontSize, color: color.sub }}>
              {businessLabel} {regionLabels && `· ${regionLabels}`}
            </div>
          </div>
          <div
            style={{
              fontSize: largeFontSize,
              fontWeight: 800,
              color: "#ffffff",
              textAlign: "right",
            }}
          >
            {salaryText}
          </div>
        </div>
      );

    case "split":
      return (
        <div style={{ width: "100%", height: "100%", display: "flex" }}>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "30px",
              borderRight: `3px solid ${color.main}`,
            }}
          >
            <div
              style={{
                fontSize: mediumFontSize,
                fontWeight: 700,
                color: color.main,
                marginBottom: "10px",
              }}
            >
              {businessName}
            </div>
            <div style={{ fontSize: smallFontSize, color: color.sub }}>
              {regionLabels || businessLabel}
            </div>
          </div>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "30px",
            }}
          >
            <div
              style={{
                fontSize: largeFontSize,
                fontWeight: 800,
                color: "#ffffff",
                marginBottom: "8px",
              }}
            >
              {salaryText}
            </div>
            <div style={{ fontSize: smallFontSize, color: color.sub }}>
              {businessIcon} {businessLabel}
            </div>
          </div>
        </div>
      );

    case "badge-top":
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            padding: "30px",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "10px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                background: `${color.main}20`,
                color: color.main,
                padding: "8px 16px",
                borderRadius: "20px",
                fontSize: smallFontSize,
                fontWeight: 600,
              }}
            >
              {businessIcon} {businessLabel}
            </div>
            {regionLabels && (
              <div
                style={{
                  background: `${color.sub}20`,
                  color: color.sub,
                  padding: "8px 16px",
                  borderRadius: "20px",
                  fontSize: smallFontSize,
                  fontWeight: 600,
                }}
              >
                {regionLabels}
              </div>
            )}
          </div>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                fontSize: largeFontSize,
                fontWeight: 800,
                color: color.main,
                marginBottom: "15px",
                lineHeight: 1.2,
              }}
            >
              {businessName}
            </div>
            <div
              style={{
                fontSize: mediumFontSize,
                fontWeight: 700,
                color: "#ffffff",
              }}
            >
              {salaryText}
            </div>
          </div>
        </div>
      );

    case "diagonal":
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "30px",
              left: "30px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              maxWidth: "50%",
            }}
          >
            <div
              style={{
                fontSize: mediumFontSize,
                fontWeight: 700,
                color: color.main,
                lineHeight: 1.2,
              }}
            >
              {businessName}
            </div>
            <div style={{ fontSize: smallFontSize, color: color.sub }}>
              {businessIcon} {businessLabel}
            </div>
          </div>
          <div
            style={{
              position: "absolute",
              bottom: "30px",
              right: "30px",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: "8px",
            }}
          >
            <div
              style={{
                fontSize: largeFontSize,
                fontWeight: 800,
                color: "#ffffff",
              }}
            >
              {salaryText}
            </div>
            {regionLabels && (
              <div style={{ fontSize: smallFontSize, color: color.sub }}>
                {regionLabels}
              </div>
            )}
          </div>
        </div>
      );

    case "minimal":
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "30px",
          }}
        >
          <div
            style={{
              fontSize: largeFontSize * 1.2,
              fontWeight: 900,
              color: color.main,
              textAlign: "center",
              lineHeight: 1.1,
              marginBottom: "20px",
            }}
          >
            {businessName}
          </div>
          <div
            style={{
              fontSize: smallFontSize,
              color: color.sub,
              opacity: 0.7,
              display: "flex",
              gap: "8px",
            }}
          >
            <span>{businessLabel}</span>
            {regionLabels && <span>· {regionLabels}</span>}
            <span>· {salaryText}</span>
          </div>
        </div>
      );

    default:
      return null;
  }
}
