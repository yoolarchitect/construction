import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";

function computeGrandTotal(inv: { amount: unknown; discount: unknown }) {
  const subtotal = Number(inv.amount || 0);
  const discount = Number(inv.discount || 0);
  return subtotal - discount;
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: { status?: string; projectId?: string; recipient?: string };
}) {
  const { status, projectId, recipient } = searchParams;

  const [invoices, projects, unfilteredInvoices] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        deletedAt: null,
        ...(status ? { status: status as any } : {}),
        ...(projectId ? { projectId } : {}),
        ...(recipient ? { recipientName: { contains: recipient, mode: "insensitive" } } : {}),
      },
      include: {
        project: { select: { name: true } },
        company: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.project.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
    }),
    prisma.invoice.findMany({
      where: { deletedAt: null },
      include: { payments: true },
    }),
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID": return "bg-green-100 text-green-700 border-green-200";
      case "OVERDUE": return "bg-red-100 text-red-700 border-red-200";
      case "SENT": return "bg-blue-100 text-blue-700 border-blue-200";
      case "PARTIAL": return "bg-amber-100 text-amber-700 border-amber-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const remainingDue = (i: (typeof unfilteredInvoices)[number]) => {
    const grand = computeGrandTotal(i);
    const paid = i.payments.reduce((s: number, p: { amount: unknown }) => s + Number(p.amount), 0);
    return Math.max(0, grand - paid);
  };

  const unpaidInvoices = unfilteredInvoices.filter((i: any) => i.status !== "PAID" && i.status !== "DRAFT");
  const overdueInvoices = unfilteredInvoices.filter((i: any) => i.status === "OVERDUE");
  const paidInvoices = unfilteredInvoices.filter((i: any) => i.status === "PAID");

  const totalUnpaid = unpaidInvoices.reduce((sum: number, i: any) => sum + remainingDue(i), 0);
  const totalOverdue = overdueInvoices.reduce((sum: number, i: any) => sum + remainingDue(i), 0);
  const totalCollected = unfilteredInvoices.reduce(
    (sum: number, i: any) => sum + i.payments.reduce((s: number, p: { amount: unknown }) => s + Number(p.amount), 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-display transition-all">Invoices</h1>
          <p className="text-sm text-slate-500">Track payments and bill your clients</p>
        </div>

        <Link
          href="/invoices/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 transition-all active:scale-[0.98]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          Create Invoice
        </Link>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Total Unpaid</p>
          </div>
          <p className="text-3xl font-black text-slate-900 font-display transition-all">${totalUnpaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{unpaidInvoices.length} Pending Invoices</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Overdue</p>
          </div>
          <p className="text-3xl font-black text-red-600 font-display transition-all">${totalOverdue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          <p className="text-[10px] text-red-400/60 font-bold uppercase mt-1">{overdueInvoices.length} Past Due Date</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Total Collected</p>
          </div>
          <p className="text-3xl font-black text-green-600 font-display transition-all">${totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          <p className="text-[10px] text-green-400/60 font-bold uppercase mt-1">{paidInvoices.length} Fully Paid</p>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-end">
        <form action="" method="get" className="flex flex-wrap gap-4 items-end w-full">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Status</label>
            <select name="status" defaultValue={status || ""} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all">
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SENT">Sent</option>
              <option value="PARTIAL">Partial</option>
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Project</label>
            <select name="projectId" defaultValue={projectId || ""} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all">
              <option value="">All Projects</option>
              {projects.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-2 min-w-[250px]">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Recipient Name</label>
            <input type="text" name="recipient" defaultValue={recipient || ""} placeholder="Search client name..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all" />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-slate-900 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all active:scale-[0.98]">Filter</button>
            <Link href="/invoices" className="bg-slate-100 text-slate-600 px-6 py-2 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all">Reset</Link>
          </div>
        </form>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-bottom border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 font-semibold text-slate-600">Invoice #</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Client / Project</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Issued / Due</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Amount</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Status</th>
                <th className="px-6 py-4 font-semibold text-slate-600"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((invoice: any) => (
                <tr key={invoice.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{invoice.invoiceNumber || "INV-TEMP"}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-tighter">{invoice.company?.name || "Main Entity"}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-900 font-medium">{invoice.recipientName || "Unspecified"}</div>
                    <div className="text-xs text-slate-500">{invoice.project?.name || "No Project"}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-900">{format(invoice.issueDate, "MMM d, yyyy")}</div>
                    <div className="text-xs text-slate-500">Due {format(invoice.dueDate, "MMM d, yyyy")}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">
                      ${computeGrandTotal(invoice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 px-6">
                      <Link
                        href={`/invoices/${invoice.id}/edit`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-teal-600 transition-all opacity-0 group-hover:opacity-100"
                        title="Edit Invoice"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                      </Link>
                      <Link
                        href={`/invoices/${invoice.id}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-teal-600 transition-all"
                        title="View Details"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <div className="mx-auto w-12 h-12 mb-4 text-slate-200 transition-all">
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
                    </div>
                    No invoices found. Try adjusting your filters or create your first invoice.
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
