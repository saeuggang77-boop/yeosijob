import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getBannerDesign } from "@/lib/constants/banner-themes";

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
    const bannerColor = Number(searchParams.get("c")) || 0;

    const design = getBannerDesign(id, bannerColor);
    const mc = hexToRgb(design.color.main);
    const sc = hexToRgb(design.color.sub);

    // 배경 그라데이션 (ad.id 해시 기반으로 8종 중 선택)
    const bg1 = getBackground(design.patternIndex, mc, design.color.bg);
    // 장식용 보조 그라데이션
    const bg2 = getAccent(design.layoutIndex, mc, sc, design.color.bg);

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            background: bg1,
          }}
        >
          {/* 장식 요소 - 우측 그라데이션 페이드 */}
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "50%",
              height: "100%",
              background: bg2,
              display: "flex",
            }}
          />

          {/* 대각선 장식 라인 */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: "100%",
              height: "4px",
              background: `linear-gradient(to right, ${design.color.main}, ${design.color.sub}, transparent)`,
              display: "flex",
            }}
          />

          {/* 코너 액센트 */}
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "60px",
              height: "60px",
              background: `linear-gradient(225deg, rgba(${mc.r},${mc.g},${mc.b},0.2) 0%, transparent 70%)`,
              display: "flex",
            }}
          />
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

/** 메인 배경 그라데이션 (8종) */
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

/** 보조 액센트 그라데이션 (6종) */
function getAccent(idx: number, mc: { r: number; g: number; b: number }, sc: { r: number; g: number; b: number }, bg: string) {
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
