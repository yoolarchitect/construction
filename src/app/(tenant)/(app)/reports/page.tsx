import Link from "next/link";

const REPORTS = [
  {
    href: "/reports/financial",
    title: "Financial Overview",
    description: "Deep dive into project budgets, actual costs, and variance analysis. Filter by period and specific materials.",
    gradient: "from-teal-500 to-emerald-600",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="m17 5-5-3-5 3"/><path d="m17 19-5 3-5-3"/><path d="M2 12h20"/><path d="m5 7-3 5 3 5"/><path d="m19 7 3 5-3 5"/></svg>
    )
  },
  {
    href: "/reports/profit-loss",
    title: "Profit & Loss",
    description: "Analyze your income streams against cost of sales. Real-time net profit summary for custom date ranges.",
    gradient: "from-blue-500 to-indigo-600",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
    )
  },
  {
    href: "/reports/balance-sheet",
    title: "Balance Sheet",
    description: "Snapshot of your company's fiscal position. Track receivables, liabilities, and equity at any given date.",
    gradient: "from-purple-500 to-violet-600",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
    )
  },
] as const;

export default function ReportsIndexPage() {
  return (
    <div className="w-full space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-3xl">
        <h1 className="page-title text-4xl mb-2">Intelligence & Reports</h1>
        <p className="page-subtitle text-lg">Gain powerful insights into your construction business performance and financial health.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((r) => (
          <Link
            key={r.href}
            href={r.href}
            className="group relative h-full flex flex-col overflow-hidden rounded-[2rem] border border-white bg-white/70 shadow-xl shadow-slate-200/50 backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-300/60"
          >
            <div className={`h-24 w-full bg-gradient-to-br ${r.gradient} opacity-90 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white`}>
               <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                 {r.icon}
               </div>
            </div>
            <div className="p-8 flex-1 flex flex-col">
              <h2 className="text-xl font-black text-slate-900 mb-3 group-hover:text-teal-600 transition-colors">{r.title}</h2>
              <p className="text-sm font-medium text-slate-500 leading-relaxed flex-1">
                {r.description}
              </p>
              <div className="mt-6 flex items-center gap-2 text-sm font-bold text-teal-600 uppercase tracking-widest group-hover:gap-3 transition-all">
                Run Report
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="card bg-slate-900 !border-slate-800 !p-10 flex flex-col md:flex-row items-center gap-8 text-white relative overflow-hidden">
         <div className="absolute top-0 right-0 h-full w-1/2 bg-gradient-to-l from-teal-500/10 to-transparent pointer-events-none"></div>
         <div className="flex-1 space-y-4">
            <h3 className="text-2xl font-black">Need a custom snapshot?</h3>
            <p className="text-slate-400 font-medium leading-relaxed">
              Our financial reports support deep filtering by date range, specific project, and material category to help you find exactly what you're looking for.
            </p>
         </div>
         <div className="shrink-0 flex gap-4">
            <div className="h-1 w-12 rounded-full bg-white/10 mt-4 hidden md:block"></div>
            <div className="h-1 w-12 rounded-full bg-teal-500 mt-4 hidden md:block"></div>
         </div>
      </div>
    </div>
  );
}
