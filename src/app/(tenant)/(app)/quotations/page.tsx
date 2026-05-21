import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";
import { computeQuotationTotal } from "./quotation-math";

function getStatusColor(status: string) {
  switch (status) {
    case "ACCEPTED": return "bg-green-100 text-green-700 border-green-200";
    case "REJECTED": return "bg-red-100 text-red-700 border-red-200";
    case "SENT": return "bg-blue-100 text-blue-700 border-blue-200";
    case "EXPIRED": return "bg-orange-100 text-orange-700 border-orange-200";
    default: return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

export default async function QuotationsPage({
  searchParams,
}: {
  searchParams: { status?: string; projectId?: string; recipient?: string };
}) {
  const { status, projectId, recipient } = searchParams;

  const [quotations, projects] = await Promise.all([
    prisma.quotation.findMany({
      where: {
        deletedAt: null,
        ...(status ? { status: status as any } : {}),
        ...(projectId ? { projectId } : {}),
        ...(recipient ? { recipientName: { contains: recipient, mode: "insensitive" } } : {}),
      },
      include: {
        project: { select: { name: true } },
        company: { select: { name: true } },
        items: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.project.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
    }),
  ]);

  const totalDraft = quotations.filter((q) => q.status === "DRAFT").length;
  const totalSent = quotations.filter((q) => q.status === "SENT").length;
  const totalAccepted = quotations.filter((q) => q.status === "ACCEPTED").length;
  const totalAcceptedValue = quotations
    .filter((q) => q.status === "ACCEPTED")
    .reduce((sum, q) => sum + computeQuotationTotal(q), 0);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(v);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-display">Quotations</h1>
          <p className="text-sm text-slate-500">Create and manage price quotations for clients</p>
        </div>
        <Link
          href="/quotations/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 transition-all active:scale-[0.98]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          New Quotation
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Draft / Sent</p>
          <p className="text-3xl font-black text-slate-900 font-display">{totalDraft + totalSent}</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Awaiting response</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Accepted</p>
          <p className="text-3xl font-black text-green-600 font-display">{totalAccepted}</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Won quotations</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Accepted Value</p>
          <p className="text-3xl font-black text-teal-600 font-display">${formatCurrency(totalAcceptedValue)}</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Total won revenue</p>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <form action="" method="get" className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Status</label>
            <select name="status" defaultValue={status || ""} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm">
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SENT">Sent</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="REJECTED">Rejected</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Project</label>
            <select name="projectId" defaultValue={projectId || ""} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm">
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-2 min-w-[220px]">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Recipient</label>
            <input type="text" name="recipient" defaultValue={recipient || ""} placeholder="Search..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm" />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-slate-900 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all">Filter</button>
            <Link href="/quotations" className="bg-slate-100 text-slate-600 px-6 py-2 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all">Reset</Link>
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 font-semibold text-slate-600">Quotation #</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Client / Project</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Issued / Valid Until</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Amount</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Status</th>
                <th className="px-6 py-4 font-semibold text-slate-600"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {quotations.map((q) => (
                <tr key={q.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{q.quotationNumber || "QUO-TEMP"}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-tighter">{q.company?.name || "—"}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-900 font-medium">{q.recipientName || "Unspecified"}</div>
                    <div className="text-xs text-slate-500">{q.project?.name || "No Project"}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-900">{format(q.issueDate, "MMM d, yyyy")}</div>
                    <div className="text-xs text-slate-500">Valid {format(q.validUntil, "MMM d, yyyy")}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">
                      ${formatCurrency(computeQuotationTotal(q))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(q.status)}`}>
                      {q.status}
                    </span>
                    {q.convertedToInvoiceId && (
                      <div className="text-[10px] text-teal-600 font-semibold mt-1">→ Invoiced</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/quotations/${q.id}/edit`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-teal-600 transition-all opacity-0 group-hover:opacity-100"
                        title="Edit"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                      </Link>
                      <Link
                        href={`/quotations/${q.id}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-teal-600 transition-all"
                        title="View"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {quotations.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No quotations found. Create your first quotation.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
