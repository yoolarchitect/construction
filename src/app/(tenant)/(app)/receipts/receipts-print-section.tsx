"use client";

import { useRef } from "react";
import { format } from "date-fns";

type ReceiptRow = {
  id: string;
  receiptNumber: string | null;
  amount: number;
  paidAt: Date;
  paymentMethod: string | null;
  reference: string | null;
  accountNo: string | null;
  notes: string | null;
  invoiceNumber: string | null;
  recipientName: string | null;
};

function ReceiptSlip({
  receipt,
  tenantName,
  tenantLogoUrl,
  copyLabel,
}: {
  receipt: ReceiptRow;
  tenantName: string;
  tenantLogoUrl: string | null;
  tenantBusinessInfo: string | null;
  copyLabel?: string;
}) {
  const amountFormatted = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(receipt.amount);
  const paidDate = format(new Date(receipt.paidAt), "MMMM d, yyyy");

  return (
    <div className="receipt-slip font-sans" style={{ background: "#fff", display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <div style={{ background: "linear-gradient(90deg,#0d9488,#0891b2)", height: 6 }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "16px 20px 12px", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {tenantLogoUrl ? (
            <img src={tenantLogoUrl} alt="Logo" style={{ height: 44, width: "auto", maxWidth: 100, objectFit: "contain" }} referrerPolicy="no-referrer" />
          ) : (
            <div style={{ width: 44, height: 44, background: "#0d9488", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontWeight: 900, fontSize: 18 }}>{tenantName.slice(0, 1).toUpperCase()}</span>
            </div>
          )}
          <div>
            <div style={{ fontWeight: 900, fontSize: 13, color: "#0f172a", letterSpacing: -0.3 }}>{tenantName}</div>
            {copyLabel && <div style={{ fontSize: 9, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.15em", marginTop: 2 }}>{copyLabel}</div>}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ display: "inline-block", border: "2px solid #0d9488", borderRadius: 6, padding: "4px 14px", color: "#0d9488", fontWeight: 900, fontSize: 13, letterSpacing: "0.08em" }}>MONEY RECEIPT</div>
          <div style={{ marginTop: 6, fontSize: 11, color: "#64748b" }}>
            <span style={{ fontWeight: 700 }}>Receipt No: </span>
            <span style={{ fontWeight: 900, color: "#0f172a", fontFamily: "monospace" }}>{receipt.receiptNumber ?? "—"}</span>
          </div>
          <div style={{ fontSize: 11, color: "#64748b" }}>
            <span style={{ fontWeight: 700 }}>Date: </span>{paidDate}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, padding: "12px 20px 16px", fontSize: 12 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {[
              { label: "Received with thanks from", value: receipt.recipientName ?? "—", bold: true },
              { label: "For invoice", value: (receipt.invoiceNumber ?? "—") + (receipt.notes ? ` — ${receipt.notes}` : ""), bold: true },
              { label: "Payment method", value: receipt.paymentMethod ?? "—", bold: false },
              { label: "Account No", value: receipt.accountNo ?? "—", bold: false },
              { label: "Reference", value: receipt.reference ?? "—", bold: false },
            ].map(({ label, value, bold }) => (
              <tr key={label}>
                <td style={{ padding: "5px 12px 5px 0", color: "#64748b", whiteSpace: "nowrap", width: 160, verticalAlign: "bottom" }}>{label}:</td>
                <td style={{ padding: "5px 0", borderBottom: "1px dotted #cbd5e1", fontWeight: bold ? 700 : 400, color: "#0f172a", paddingBottom: 4 }}>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Amount box */}
        <div style={{ marginTop: 16, padding: "10px 14px", border: "2px solid #0d9488", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f0fdfa" }}>
          <span style={{ color: "#0f766e", fontWeight: 700, fontSize: 12 }}>Amount received:</span>
          <span style={{ background: "#0d9488", color: "#fff", fontWeight: 900, fontSize: 16, padding: "5px 20px", borderRadius: 4, letterSpacing: 0.5 }}>
            {amountFormatted}
          </span>
        </div>

        {/* Signature row */}
        <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ fontSize: 10, color: "#94a3b8" }}>This receipt is valid proof of payment.</div>
          <div style={{ textAlign: "center", minWidth: 180 }}>
            <div style={{ borderBottom: "1px solid #94a3b8", marginBottom: 4, height: 32 }} />
            <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em" }}>Authorized Signature</div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ background: "linear-gradient(90deg,#0d9488,#0891b2)", height: 4 }} />
    </div>
  );
}

function PrintableReceipt({
  receipt,
  tenantName,
  tenantLogoUrl,
  tenantBusinessInfo,
}: {
  receipt: ReceiptRow;
  tenantName: string;
  tenantLogoUrl: string | null;
  tenantBusinessInfo: string | null;
}) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const el = printRef.current;
    if (!el) return;

    // Clone receipt into a direct child of body to bypass any print:hidden ancestor
    const clone = document.createElement("div");
    clone.className = "print-this-receipt receipt-two-copies";
    clone.innerHTML = el.innerHTML;
    document.body.appendChild(clone);
    document.body.classList.add("print-single-receipt");

    window.print();

    document.body.classList.remove("print-single-receipt");
    document.body.removeChild(clone);
  };

  const amountFormatted = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(receipt.amount);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="p-6 bg-[#faf8f5]">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Receipt No.</p>
            <p className="text-lg font-black text-slate-900 font-mono">{receipt.receiptNumber || "—"}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Amount</p>
            <p className="text-lg font-black text-teal-700">{amountFormatted}</p>
          </div>
        </div>
        <div className="text-sm text-slate-600 space-y-1">
          <p><span className="font-semibold text-slate-800">From:</span> {receipt.recipientName || "—"}</p>
          <p><span className="font-semibold text-slate-800">Invoice:</span> {receipt.invoiceNumber || "—"}</p>
          <p><span className="font-semibold text-slate-800">Method:</span> {receipt.paymentMethod || "—"}</p>
          <p><span className="font-semibold text-slate-800">Date:</span> {format(new Date(receipt.paidAt), "MMM d, yyyy")}</p>
        </div>
      </div>
      <div className="border-t border-slate-200 bg-slate-50/50 px-4 py-3 flex justify-end">
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
            <path d="M6 9V2h12v7" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><path d="M6 14h12v8H6z" />
          </svg>
          Print receipt
        </button>
      </div>

      {/* Hidden print copy */}
      <div ref={printRef} className="hidden print:!block receipt-two-copies" aria-hidden>
        <div className="receipt-copy">
          <ReceiptSlip receipt={receipt} tenantName={tenantName} tenantLogoUrl={tenantLogoUrl} tenantBusinessInfo={tenantBusinessInfo} copyLabel="Customer copy" />
        </div>
        <div className="receipt-copy">
          <ReceiptSlip receipt={receipt} tenantName={tenantName} tenantLogoUrl={tenantLogoUrl} tenantBusinessInfo={tenantBusinessInfo} copyLabel="Office copy" />
        </div>
      </div>
    </div>
  );
}

export function ReceiptsPrintSection({
  payments,
  tenantName,
  tenantLogoUrl,
  tenantBusinessInfo,
}: {
  payments: ReceiptRow[];
  tenantName: string;
  tenantLogoUrl: string | null;
  tenantBusinessInfo: string | null;
}) {
  if (payments.length === 0) return null;

  return (
    <div className="print:hidden">
      <h2 className="text-lg font-bold text-slate-900 mb-4">Print Individual Receipts</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {payments.map((p) => (
          <PrintableReceipt
            key={p.id}
            receipt={p}
            tenantName={tenantName}
            tenantLogoUrl={tenantLogoUrl}
            tenantBusinessInfo={tenantBusinessInfo}
          />
        ))}
      </div>
    </div>
  );
}
