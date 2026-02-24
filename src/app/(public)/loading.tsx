export default function HomeLoading() {
  return (
    <div className="animate-pulse">
      {/* Banner skeleton */}
      <div className="h-48 bg-muted md:h-64" />

      {/* VIP section */}
      <div className="px-4 py-6">
        <div className="mb-4 h-6 w-32 rounded bg-muted" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 rounded-lg bg-muted" />
          ))}
        </div>
      </div>

      {/* Line ads skeleton */}
      <div className="px-4 py-6">
        <div className="mb-4 h-6 w-40 rounded bg-muted" />
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-10 rounded bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}
