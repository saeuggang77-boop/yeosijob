"use client";

export default function AdminUsersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-8">
      <h2 className="text-xl font-bold text-red-600">에러 발생</h2>
      <pre className="mt-4 whitespace-pre-wrap rounded bg-red-50 p-4 text-sm text-red-800">
        {error.message}
      </pre>
      {error.digest && (
        <p className="mt-2 text-sm text-muted-foreground">Digest: {error.digest}</p>
      )}
      <button
        onClick={reset}
        className="mt-4 rounded bg-primary px-4 py-2 text-sm text-primary-foreground"
      >
        다시 시도
      </button>
    </div>
  );
}
