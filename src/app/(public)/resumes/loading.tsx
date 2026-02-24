export default function ResumesLoading() {
  return (
    <div className="mx-auto max-w-screen-xl animate-pulse px-4 py-6">
      <div className="mb-6 h-8 w-32 rounded bg-muted" />

      {/* Filters */}
      <div className="mb-4 flex gap-2">
        <div className="h-10 w-28 rounded-md bg-muted" />
        <div className="h-10 w-28 rounded-md bg-muted" />
      </div>

      {/* Resume cards */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted" />
              <div className="space-y-1.5">
                <div className="h-4 w-20 rounded bg-muted" />
                <div className="h-3 w-32 rounded bg-muted" />
              </div>
            </div>
            <div className="mt-3 space-y-1.5">
              <div className="h-3 w-full rounded bg-muted" />
              <div className="h-3 w-2/3 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
