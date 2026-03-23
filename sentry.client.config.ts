import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // 에러 100% 캡처
  // 성능 모니터링 10% 샘플링
  tracesSampleRate: 0.1,

  // 에러 발생 시 세션 리플레이 100% 캡처 (디버깅용)
  replaysOnErrorSampleRate: 1.0,
  // 일반 세션은 캡처하지 않음 (비용 절약)
  replaysSessionSampleRate: 0,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // 불필요한 에러 필터링
  beforeSend(event) {
    const message = event.exception?.values?.[0]?.value || "";

    // 브라우저 확장 프로그램 에러 무시
    if (message.includes("chrome-extension://")) return null;

    // 청크 로드 실패 (네트워크 문제) 무시
    if (message.includes("ChunkLoadError")) return null;
    if (message.includes("Loading chunk")) return null;

    // ResizeObserver 에러 무시
    if (message.includes("ResizeObserver")) return null;

    return event;
  },
});
