import Link from "next/link";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 12;

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page = "1" } = await searchParams;
  const current = Math.max(1, parseInt(page, 10) || 1);
  const skip = (current - 1) * PAGE_SIZE;

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where: {},
      take: PAGE_SIZE,
      skip,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.project.count({ where: {} }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const stats = [
    { label: "Total Projects", value: total, accent: false },
    { label: "Active", value: projects.filter(p => p.status === 'ACTIVE').length, accent: true },
    { label: "Total Budget", value: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(projects.reduce((sum, p) => sum + Number(p.budget), 0)), accent: false },
  ];

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title text-4xl mb-1">Projects</h1>
          <p className="page-subtitle text-lg">Manage and track your construction portfolios</p>
        </div>
        <Link href="/projects/new" className="btn btn-primary px-8 py-3 text-base group">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-2 transition-transform group-hover:rotate-90"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          New Project
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((s, i) => (
          <div key={i} className="stat-card p-8 group">
            <span className="stat-label mb-2 block">{s.label}</span>
            <span className={s.accent ? "stat-value-accent text-3xl" : "stat-value text-3xl"}>{s.value}</span>
            <div className="mt-4 h-1 w-12 rounded-full bg-slate-100 group-hover:bg-teal-500/20 transition-all group-hover:w-full"></div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block table-wrap">
        <table>
          <thead>
            <tr>
              <th>Project Name</th>
              <th>Status</th>
              <th>Budget</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {projects.map((p) => (
              <tr key={p.id} className="group transition-all hover:bg-white">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-teal-600 group-hover:bg-teal-50 group-hover:text-teal-700 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="M3 9V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4"/></svg>
                    </div>
                    <span className="font-bold text-slate-900">{p.name}</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                    p.status === 'ACTIVE' ? 'bg-teal-50 text-teal-700' : 
                    p.status === 'COMPLETED' ? 'bg-blue-50 text-blue-700' : 
                    p.status === 'PLANNING' ? 'bg-indigo-50 text-indigo-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
                      p.status === 'ACTIVE' ? 'bg-teal-500' : 
                      p.status === 'COMPLETED' ? 'bg-blue-500' : 
                      p.status === 'PLANNING' ? 'bg-indigo-500' :
                      'bg-slate-400'
                    }`}></span>
                    {p.status}
                  </span>
                </td>
                <td className="px-6 py-5 font-mono text-slate-600 font-medium">
                  {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(p.budget))}
                </td>
                <td className="px-6 py-5 text-right">
                  <Link 
                    href={`/projects/${p.id}`} 
                    className="inline-flex items-center gap-2 text-sm font-bold text-teal-600 hover:text-teal-700 transition-colors"
                  >
                    Manage
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
        {projects.map((p) => (
          <Link key={p.id} href={`/projects/${p.id}`} className="card p-6 flex flex-col gap-4 group active:scale-[0.98] transition-all">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="M3 9V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4"/></svg>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 line-clamp-1">{p.name}</h3>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Budget: {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(p.budget))}</span>
                </div>
              </div>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${
                p.status === 'ACTIVE' ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-600'
              }`}>
                {p.status}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6">
          <p className="text-sm font-medium text-slate-500">
            Showing <span className="text-slate-900">Page {current}</span> of <span className="text-slate-900">{totalPages}</span>
          </p>
          <div className="flex gap-3">
            {current > 1 && (
              <Link href={`/projects?page=${current - 1}`} className="btn btn-secondary px-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="m15 18-6-6 6-6"/></svg>
                Previous
              </Link>
            )}
            {current < totalPages && (
              <Link href={`/projects?page=${current + 1}`} className="btn btn-secondary px-6">
                Next
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-2"><path d="m9 18 6-6-6-6"/></svg>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
