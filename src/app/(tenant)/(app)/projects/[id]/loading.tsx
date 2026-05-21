export default function ProjectDetailLoading() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="h-8 w-56 animate-pulse rounded bg-slate-200 sm:w-72" />
            <div className="h-6 w-20 animate-pulse rounded-full bg-slate-200" />
            <div className="flex gap-2">
              <div className="h-9 w-16 animate-pulse rounded bg-slate-200" />
              <div className="h-9 w-20 animate-pulse rounded bg-slate-200" />
            </div>
          </div>
          <div className="mt-3 flex gap-4">
            <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      </div>

      {/* Summary cards skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="h-4 w-16 animate-pulse rounded bg-slate-200" />
            <div className="mt-3 h-8 w-28 animate-pulse rounded bg-slate-200 sm:w-32" />
            {i === 3 && (
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-2/5 animate-pulse rounded-full bg-slate-200" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Tabs skeleton */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex border-b border-slate-200">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border-b-2 border-transparent px-6 py-3">
              <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
            </div>
          ))}
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
            <div className="h-4 max-w-md animate-pulse rounded bg-slate-100" style={{ width: "85%" }} />
            <div className="h-4 max-w-sm animate-pulse rounded bg-slate-100" style={{ width: "75%" }} />
            <div className="h-4 max-w-xs animate-pulse rounded bg-slate-100" style={{ width: "90%" }} />
            <div className="h-10 w-32 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      </div>
    </div>
  );
}
