export default function JobsLoading() {
  return (
    <div className="mx-auto max-w-screen-xl animate-pulse px-4 py-6">
      {/* Header */}
      <div className="mb-6 h-8 w-48 rounded bg-muted" />

      {/* Filters */}
      <div className="mb-4 flex gap-2">
        <div className="h-10 w-28 rounded-md bg-muted" />
        <div className="h-10 w-28 rounded-md bg-muted" />
        <div className="h-10 flex-1 rounded-md bg-muted" />
      </div>

      {/* Job list */}
      <div className="space-y-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-md border p-3">
            <div className="h-5 w-16 rounded bg-muted" />
            <div className="h-5 flex-1 rounded bg-muted" />
            <div className="h-5 w-20 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
