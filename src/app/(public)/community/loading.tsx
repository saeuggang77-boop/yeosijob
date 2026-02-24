export default function CommunityLoading() {
  return (
    <div className="mx-auto max-w-screen-md animate-pulse px-4 py-6">
      <div className="mb-6 h-8 w-32 rounded bg-muted" />

      {/* Category tabs */}
      <div className="mb-4 flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 w-20 rounded-md bg-muted" />
        ))}
      </div>

      {/* Posts */}
      <div className="space-y-1 divide-y rounded-lg border">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-3">
            <div className="space-y-1.5">
              <div className="h-4 w-48 rounded bg-muted" />
              <div className="h-3 w-24 rounded bg-muted" />
            </div>
            <div className="h-4 w-8 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
