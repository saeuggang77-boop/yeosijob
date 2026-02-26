import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=()" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tosspayments.com https://js.tosspayments.com https://cdn.portone.io https://t1.kakaocdn.net https://t1.daumcdn.net https://dapi.kakao.com https://developers.kakao.com https://www.googletagmanager.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://api.tosspayments.com https://api.portone.io https://kapi.kakao.com https://dapi.kakao.com https://www.google-analytics.com",
              "frame-src 'self' https://payment-widget.tosspayments.com https://cdn.portone.io",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
