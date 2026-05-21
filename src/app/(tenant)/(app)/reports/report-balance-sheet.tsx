import React from "react";

export type BalanceSheetData = {
  totalBudget: number;
  totalReceived: number;
  totalExpenses: number;
  receivables: number;
  netPosition: number;
  fixedAssetsTotal: number;
  currentAssetsTotal: number;
};

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function ReportBalanceSheet({
  data,
  asAtLabel,
  generatedAt,
  tenantName,
  tenantLogoUrl,
  tenantBusinessInfo,
}: {
  data: BalanceSheetData;
  asAtLabel: string;
  generatedAt: string;
  tenantName: string;
  tenantLogoUrl: string | null;
  tenantBusinessInfo: string | null;
}) {
  const currentAssetsSubtotal = data.totalReceived + data.receivables + data.currentAssetsTotal;
  const totalAssets = currentAssetsSubtotal + data.fixedAssetsTotal;
  const totalLiabilities = 0;
  const totalEquity = totalAssets - totalLiabilities;
  const liabilitiesPlusEquity = totalLiabilities + totalEquity;

  const row = "py-2 px-4 border-b border-slate-100 text-sm";
  const rowIndent = "py-1.5 pl-8 pr-4 border-b border-slate-100 text-sm text-slate-600";
  const rowVal = "py-2 pr-4 text-right tabular-nums text-sm text-slate-900 border-b border-slate-100";
  const rowValIndent = "py-1.5 pr-4 text-right tabular-nums text-sm text-slate-700 border-b border-slate-100";
  const sectionHead = "px-4 py-2.5 text-xs font-black uppercase tracking-[0.15em] border-b border-slate-200 bg-slate-50";
  const subHead = "pl-5 pr-4 py-2 font-bold text-slate-800 border-b border-slate-100 text-sm";
  const subVal = "pr-4 py-2 text-right font-bold tabular-nums text-sm text-slate-900 border-b border-slate-100";

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 print:hidden">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Assets</p>
          <p className="text-2xl font-black text-slate-900">{fmt(totalAssets)}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Cash Received</p>
          <p className="text-2xl font-black text-emerald-700">{fmt(data.totalReceived)}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1">Receivables</p>
          <p className="text-2xl font-black text-amber-700">{fmt(data.receivables)}</p>
        </div>
        <div className={`rounded-2xl border p-5 shadow-sm ${data.netPosition >= 0 ? "border-teal-200 bg-teal-50" : "border-red-200 bg-red-50"}`}>
          <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${data.netPosition >= 0 ? "text-teal-600" : "text-red-600"}`}>Net Position</p>
          <p className={`text-2xl font-black ${data.netPosition >= 0 ? "text-teal-700" : "text-red-700"}`}>{fmt(data.netPosition)}</p>
        </div>
      </div>

      {/* Balance Sheet statement */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm print:shadow-none print:rounded-none print:border-slate-300">
        <div style={{ background: "linear-gradient(90deg,#0d9488,#0891b2)", height: 4 }} />

        {/* Header with branding */}
        <div className="border-b border-slate-200 bg-slate-50/60 px-6 py-5 print:py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between print:flex-row">
            <div className="flex items-center gap-4">
              {tenantLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={tenantLogoUrl} alt="Logo" className="h-12 w-auto max-w-[100px] object-contain" referrerPolicy="no-referrer" />
              ) : (
                <div style={{ width: 48, height: 48, background: "#0d9488", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ color: "#fff", fontWeight: 900, fontSize: 18 }}>{tenantName.slice(0, 1).toUpperCase()}</span>
                </div>
              )}
              <div>
                <p className="font-black text-slate-900">{tenantName}</p>
                {tenantBusinessInfo && <p className="text-xs text-slate-500 mt-0.5 max-w-xs">{tenantBusinessInfo}</p>}
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-lg font-black uppercase tracking-wide text-slate-900">Balance Sheet</h2>
              <p className="text-sm font-semibold text-teal-600">As at {asAtLabel}</p>
              <p className="text-xs text-slate-400 print:hidden">Generated {generatedAt}</p>
            </div>
          </div>
        </div>

        <div className="p-0">
          <table className="w-full border-collapse text-left">
            <tbody>
              {/* ASSETS */}
              <tr>
                <td className={`${sectionHead} text-teal-700`}>Assets</td>
                <td className={`${sectionHead} text-right text-teal-700 pr-4`}>{fmt(totalAssets)}</td>
              </tr>
              <tr>
                <td className={subHead}>Current Assets</td>
                <td className={subVal}>{fmt(currentAssetsSubtotal)}</td>
              </tr>
              <tr>
                <td className={rowIndent}>Bank & Cash (received payments)</td>
                <td className={rowValIndent}>{fmt(data.totalReceived)}</td>
              </tr>
              <tr>
                <td className={rowIndent}>Accounts receivable (outstanding invoices)</td>
                <td className={rowValIndent}>{fmt(data.receivables)}</td>
              </tr>
              {data.currentAssetsTotal > 0 && (
                <tr>
                  <td className={rowIndent}>Other current assets</td>
                  <td className={rowValIndent}>{fmt(data.currentAssetsTotal)}</td>
                </tr>
              )}
              {data.fixedAssetsTotal > 0 && (
                <>
                  <tr>
                    <td className={subHead}>Fixed Assets</td>
                    <td className={subVal}>{fmt(data.fixedAssetsTotal)}</td>
                  </tr>
                  <tr>
                    <td className={rowIndent}>Property, plant & equipment</td>
                    <td className={rowValIndent}>{fmt(data.fixedAssetsTotal)}</td>
                  </tr>
                </>
              )}

              {/* LIABILITIES */}
              <tr>
                <td className={`${sectionHead} text-red-600`} style={{ paddingTop: 16 }}>Liabilities</td>
                <td className={`${sectionHead} text-right text-red-600 pr-4`} style={{ paddingTop: 16 }}>{fmt(totalLiabilities)}</td>
              </tr>
              <tr>
                <td className={subHead}>Current Liabilities</td>
                <td className={subVal}>{fmt(0)}</td>
              </tr>
              <tr>
                <td className={rowIndent}>Accounts payable</td>
                <td className={rowValIndent}>{fmt(0)}</td>
              </tr>
              <tr>
                <td className={rowIndent}>Other current liabilities</td>
                <td className={rowValIndent}>{fmt(0)}</td>
              </tr>

              {/* EQUITY */}
              <tr>
                <td className={`${sectionHead} text-slate-700`} style={{ paddingTop: 16 }}>Equity</td>
                <td className={`${sectionHead} text-right text-slate-700 pr-4`} style={{ paddingTop: 16 }}>{fmt(totalEquity)}</td>
              </tr>
              <tr>
                <td className={subHead}>Net Position (budget − expenses)</td>
                <td className={subVal}>{fmt(data.netPosition)}</td>
              </tr>
              <tr>
                <td className={rowIndent}>Project budgets (contracted value)</td>
                <td className={rowValIndent}>{fmt(data.totalBudget)}</td>
              </tr>
              <tr>
                <td className={rowIndent}>Less: total expenses incurred</td>
                <td className={rowValIndent}>({fmt(data.totalExpenses)})</td>
              </tr>
              <tr>
                <td className={subHead}>Retained in assets</td>
                <td className={subVal}>{fmt(Math.max(0, totalEquity - data.netPosition))}</td>
              </tr>

              {/* TOTAL */}
              <tr>
                <td className="px-4 py-3 font-black text-slate-900 text-sm border-t-2 border-slate-300 bg-slate-50">
                  Total Liabilities + Equity
                </td>
                <td className="pr-4 py-3 text-right font-black text-slate-900 tabular-nums text-sm border-t-2 border-slate-300 bg-slate-50">
                  {fmt(liabilitiesPlusEquity)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
