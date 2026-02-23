import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "여시잡 - 유흥알바 No.1 구인구직";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
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
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            background: "linear-gradient(90deg, #d4a853, #f0c674, #d4a853)",
            backgroundClip: "text",
            color: "transparent",
            fontSize: 80,
            fontWeight: 800,
            letterSpacing: -2,
          }}
        >
          여시잡
        </div>
        <div
          style={{
            color: "#b0b0b0",
            fontSize: 32,
            marginTop: 20,
          }}
        >
          유흥알바 밤알바 룸알바 No.1 구인구직
        </div>
        <div
          style={{
            color: "#666",
            fontSize: 22,
            marginTop: 16,
          }}
        >
          yeosijob.com
        </div>
      </div>
    ),
    { ...size }
  );
}
