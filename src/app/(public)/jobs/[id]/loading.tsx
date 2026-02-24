export default function JobDetailLoading() {
  return (
    <div className="mx-auto max-w-screen-md animate-pulse px-4 py-6">
      {/* Breadcrumb */}
      <div className="mb-3 h-4 w-24 rounded bg-muted" />

      {/* Title */}
      <div className="h-8 w-3/4 rounded bg-muted" />
      <div className="mt-2 h-6 w-40 rounded bg-muted" />
      <div className="mt-3 flex gap-2">
        <div className="h-6 w-16 rounded-full bg-muted" />
        <div className="h-6 w-16 rounded-full bg-muted" />
      </div>

      {/* Cards */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="mt-4 rounded-lg border p-6">
          <div className="mb-3 h-5 w-32 rounded bg-muted" />
          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-muted" />
            <div className="h-4 w-2/3 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
