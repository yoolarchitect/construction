import React from "react";

const CATEGORY_LABELS: Record<string, string> = {
  MATERIAL: "Materials",
  LABOR: "Labor",
  EQUIPMENT: "Equipment",
  SUBCONTRACT: "Subcontract",
  OTHER: "Other",
};

export type PnLData = {
  income: number;
  incomeBreakdown?: { invoicePayments: number; projectDeposits: number };
  expensesByCategory: { category: string; amount: number }[];
  totalExpenses: number;
  netProfit: number;
};

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function pct(part: number, total: number) {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
}

export function ReportProfitLoss({
  data,
  periodLabel,
  generatedAt,
}: {
  data: PnLData;
  periodLabel: string;
  generatedAt: string;
}) {
  const margin = data.income > 0 ? pct(data.netProfit, data.income) : 0;
  const isProfit = data.netProfit >= 0;

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:hidden">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Total Income</p>
          <p className="text-3xl font-black text-slate-900">{fmt(data.income)}</p>
          {data.incomeBreakdown && data.incomeBreakdown.invoicePayments > 0 && data.incomeBreakdown.projectDeposits > 0 && (
            <p className="mt-1 text-xs text-slate-500">Invoices {fmt(data.incomeBreakdown.invoicePayments)} · Deposits {fmt(data.incomeBreakdown.projectDeposits)}</p>
          )}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Total Expenses</p>
          <p className="text-3xl font-black text-red-600">{fmt(data.totalExpenses)}</p>
          <p className="mt-1 text-xs text-slate-500">{data.expensesByCategory.length} categor{data.expensesByCategory.length === 1 ? "y" : "ies"}</p>
        </div>
        <div className={`rounded-2xl border p-6 shadow-sm ${isProfit ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}>
          <p className={`text-xs font-black uppercase tracking-widest mb-1 ${isProfit ? "text-emerald-600" : "text-red-600"}`}>Net Profit</p>
          <p className={`text-3xl font-black ${isProfit ? "text-emerald-700" : "text-red-700"}`}>{fmt(data.netProfit)}</p>
          <p className={`mt-1 text-xs font-semibold ${isProfit ? "text-emerald-600" : "text-red-600"}`}>
            {isProfit ? "▲" : "▼"} {Math.abs(margin)}% margin
          </p>
        </div>
      </div>

      {/* P&L Statement */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden print:shadow-none print:rounded-none">
        <div style={{ background: "linear-gradient(90deg,#0d9488,#0891b2)", height: 4 }} />
        <div className="border-b border-slate-200 bg-slate-50/60 px-6 py-4">
          <h2 className="text-base font-black text-slate-900 uppercase tracking-wide">Profit & Loss Statement</h2>
          <p className="mt-0.5 text-sm text-slate-500">Period: {periodLabel} · Generated {generatedAt}</p>
        </div>
        <div className="p-6">
          <table className="w-full max-w-2xl text-left text-sm">
            <tbody>
              {/* Income */}
              <tr>
                <td colSpan={2} className="pb-1 pt-2 text-xs font-black uppercase tracking-[0.2em] text-teal-600 border-b border-teal-100">
                  Income
                </td>
              </tr>
              {data.incomeBreakdown && data.incomeBreakdown.invoicePayments > 0 && (
                <tr>
                  <td className="py-2 pl-4 text-slate-600">Invoice payments received</td>
                  <td className="py-2 text-right font-medium text-slate-900 tabular-nums">{fmt(data.incomeBreakdown.invoicePayments)}</td>
                </tr>
              )}
              {data.incomeBreakdown && data.incomeBreakdown.projectDeposits > 0 && data.incomeBreakdown.invoicePayments === 0 && (
                <tr>
                  <td className="py-2 pl-4 text-slate-600">Project deposits received</td>
                  <td className="py-2 text-right font-medium text-slate-900 tabular-nums">{fmt(data.incomeBreakdown.projectDeposits)}</td>
                </tr>
              )}
              {data.income === 0 && (
                <tr>
                  <td className="py-2 pl-4 text-slate-400 italic">No income recorded in this period</td>
                  <td className="py-2 text-right text-slate-400 tabular-nums">{fmt(0)}</td>
                </tr>
              )}
              <tr className="border-t border-slate-200">
                <td className="py-2.5 pl-4 font-black text-slate-800">Total Income</td>
                <td className="py-2.5 text-right font-black text-slate-900 tabular-nums">{fmt(data.income)}</td>
              </tr>

              {/* Expenses */}
              <tr>
                <td colSpan={2} className="pb-1 pt-5 text-xs font-black uppercase tracking-[0.2em] text-red-500 border-b border-red-100">
                  Cost of Sales
                </td>
              </tr>
              {data.expensesByCategory.length === 0 ? (
                <tr>
                  <td className="py-2 pl-4 text-slate-400 italic">No expenses in this period</td>
                  <td className="py-2 text-right text-slate-400 tabular-nums">{fmt(0)}</td>
                </tr>
              ) : (
                data.expensesByCategory.map(({ category, amount }) => (
                  <tr key={category}>
                    <td className="py-2 pl-4 text-slate-600">{CATEGORY_LABELS[category] ?? category}</td>
                    <td className="py-2 text-right text-slate-800 tabular-nums">({fmt(amount)})</td>
                  </tr>
                ))
              )}
              <tr className="border-t border-slate-200">
                <td className="py-2.5 pl-4 font-black text-slate-800">Total Cost of Sales</td>
                <td className="py-2.5 text-right font-black text-slate-900 tabular-nums">({fmt(data.totalExpenses)})</td>
              </tr>

              {/* Net Profit */}
              <tr>
                <td colSpan={2} className="pt-4">
                  <div className={`flex items-center justify-between rounded-xl px-5 py-4 ${isProfit ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}`}>
                    <span className={`font-black text-base uppercase tracking-wide ${isProfit ? "text-emerald-800" : "text-red-800"}`}>Net Profit</span>
                    <span className={`font-black text-xl tabular-nums ${isProfit ? "text-emerald-700" : "text-red-700"}`}>{fmt(data.netProfit)}</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
