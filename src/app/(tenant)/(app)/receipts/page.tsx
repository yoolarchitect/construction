import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";

export default async function ReceiptsPage({
  searchParams,
}: {
  searchParams: Promise<{ invoiceId?: string; from?: string; to?: string }>;
}) {
  const { invoiceId, from, to } = await searchParams;

  const payments = await prisma.invoicePayment.findMany({
    where: {
      ...(invoiceId ? { invoiceId } : {}),
      ...(from || to
        ? {
            paidAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(new Date(to).setHours(23, 59, 59, 999)) } : {}),
            },
          }
        : {}),
      invoice: { deletedAt: null },
    },
    include: {
      invoice: {
        select: {
          invoiceNumber: true,
          recipientName: true,
          project: { select: { name: true } },
        },
      },
    },
    orderBy: { paidAt: "desc" },
  });

  const totalAmount = payments.reduce((s, p) => s + Number(p.amount), 0);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-display">Receipts</h1>
          <p className="text-sm text-slate-500">All payment receipts issued from invoices</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Total Receipts</p>
          <p className="text-3xl font-black text-slate-900 font-display">{payments.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Total Amount Collected</p>
          <p className="text-3xl font-black text-green-600 font-display">{formatCurrency(totalAmount)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <form action="" method="get" className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Date From</label>
            <input
              type="date"
              name="from"
              defaultValue={from || ""}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Date To</label>
            <input
              type="date"
              name="to"
              defaultValue={to || ""}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-slate-900 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all">
              Filter
            </button>
            <Link href="/receipts" className="bg-slate-100 text-slate-600 px-6 py-2 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all">
              Reset
            </Link>
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 font-semibold text-slate-600">Receipt #</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Invoice</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Received From</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Date</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Method</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Amount</th>
                <th className="px-6 py-4 font-semibold text-slate-600"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((p) => (
                <tr key={p.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono font-bold text-slate-900">{p.receiptNumber || "—"}</span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/invoices/${p.invoiceId}`}
                      className="font-semibold text-teal-600 hover:underline"
                    >
                      {p.invoice.invoiceNumber || "—"}
                    </Link>
                    {p.invoice.project?.name && (
                      <div className="text-xs text-slate-400">{p.invoice.project.name}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-700">{p.invoice.recipientName || "—"}</td>
                  <td className="px-6 py-4 text-slate-700">{format(p.paidAt, "MMM d, yyyy")}</td>
                  <td className="px-6 py-4 text-slate-600">{p.paymentMethod || "—"}</td>
                  <td className="px-6 py-4 font-bold text-slate-900">{formatCurrency(Number(p.amount))}</td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/receipts/${p.id}`}
                      className="text-xs font-semibold text-teal-600 hover:underline"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No receipts found. Record a payment on an invoice to generate a receipt.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {payments.length > 0 && (
          <div className="border-t border-slate-100 px-6 py-4 flex justify-end">
            <div className="text-sm font-semibold text-slate-700">
              Total: <span className="text-lg font-black text-slate-900">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
