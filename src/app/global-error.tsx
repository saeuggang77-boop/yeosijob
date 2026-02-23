"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ko">
      <body className="bg-background text-foreground">
        <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
          <p className="text-8xl font-bold text-amber-500">500</p>
          <h1 className="mt-4 text-2xl font-bold">심각한 오류가 발생했습니다</h1>
          <p className="mt-2 text-gray-500">
            페이지를 불러오는 중 문제가 발생했습니다.
          </p>
          <button
            onClick={reset}
            className="mt-8 rounded-md bg-amber-500 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-amber-600"
          >
            다시 시도
          </button>
        </div>
      </body>
    </html>
  );
}
