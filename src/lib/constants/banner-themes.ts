/**
 * 광고 배너 자동 생성 - 색상/레이아웃/패턴 정의
 *
 * 15색 x 6레이아웃 x 15패턴 = 1,350가지 조합
 * ad.id 해시로 레이아웃/패턴을 결정적 선택, 업주는 색상만 선택
 */

export interface BannerColor {
  name: string;
  main: string;
  sub: string;
  bg: string; // 어두운 배경색
}

export const BANNER_COLORS: BannerColor[] = [
  { name: "골드", main: "#D4A853", sub: "#F0C674", bg: "#1a1608" },
  { name: "로즈", main: "#E91E63", sub: "#FF80AB", bg: "#1a0810" },
  { name: "퍼플", main: "#9C27B0", sub: "#CE93D8", bg: "#120818" },
  { name: "블루", main: "#2196F3", sub: "#90CAF9", bg: "#08121a" },
  { name: "틸", main: "#009688", sub: "#80CBC4", bg: "#081a18" },
  { name: "그린", main: "#4CAF50", sub: "#A5D6A7", bg: "#0a1a0a" },
  { name: "오렌지", main: "#FF9800", sub: "#FFCC80", bg: "#1a1008" },
  { name: "레드", main: "#F44336", sub: "#EF9A9A", bg: "#1a0808" },
  { name: "핑크", main: "#FF69B4", sub: "#FFB6C1", bg: "#1a0a14" },
  { name: "시안", main: "#00BCD4", sub: "#80DEEA", bg: "#081418" },
  { name: "인디고", main: "#3F51B5", sub: "#9FA8DA", bg: "#0a0c1a" },
  { name: "라임", main: "#8BC34A", sub: "#C5E1A5", bg: "#101a08" },
  { name: "앰버", main: "#FFC107", sub: "#FFE082", bg: "#1a1608" },
  { name: "딥퍼플", main: "#673AB7", sub: "#B39DDB", bg: "#0e0818" },
  { name: "스카이", main: "#03A9F4", sub: "#81D4FA", bg: "#08141a" },
];

/** 레이아웃 종류 */
export type BannerLayout =
  | "centered"
  | "left-aligned"
  | "split"
  | "badge-top"
  | "diagonal"
  | "minimal";

export const BANNER_LAYOUTS: BannerLayout[] = [
  "centered",
  "left-aligned",
  "split",
  "badge-top",
  "diagonal",
  "minimal",
];

/** 배경 패턴 종류 */
export type BannerPattern =
  | "gradient-radial"
  | "diagonal-stripes"
  | "dots"
  | "waves"
  | "grid"
  | "diamond"
  | "circles"
  | "chevron"
  | "noise"
  | "spotlight"
  | "corner-glow"
  | "horizontal-lines"
  | "cross-hatch"
  | "bokeh"
  | "vignette";

export const BANNER_PATTERNS: BannerPattern[] = [
  "gradient-radial",
  "diagonal-stripes",
  "dots",
  "waves",
  "grid",
  "diamond",
  "circles",
  "chevron",
  "noise",
  "spotlight",
  "corner-glow",
  "horizontal-lines",
  "cross-hatch",
  "bokeh",
  "vignette",
];

/** 간단한 문자열 해시 (결정적) */
export function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // 32bit integer
  }
  return Math.abs(hash);
}

/** 배너 이미지 URL 생성 (그라데이션 장식 전용, 텍스트 없음) */
export function getBannerUrl(
  ad: { id: string; bannerColor?: number },
  w: number,
  h: number,
) {
  const c = ad.bannerColor ?? 0;
  return `/api/ads/${ad.id}/banner?w=${w}&h=${h}&c=${c}`;
}

/** ad.id + bannerColor로 배너 디자인 결정 */
export function getBannerDesign(adId: string, bannerColor: number) {
  const hash = simpleHash(adId);
  const colorIndex = Math.max(0, Math.min(bannerColor, BANNER_COLORS.length - 1));

  return {
    color: BANNER_COLORS[colorIndex],
    layout: BANNER_LAYOUTS[hash % BANNER_LAYOUTS.length],
    pattern: BANNER_PATTERNS[(hash >> 4) % BANNER_PATTERNS.length],
    layoutIndex: hash % BANNER_LAYOUTS.length,
    patternIndex: (hash >> 4) % BANNER_PATTERNS.length,
  };
}
