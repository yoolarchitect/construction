"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Swal from "sweetalert2";
import { createInvoicePaymentAction, deleteInvoicePaymentAction } from "../actions";
import { useFormAlert } from "@/components/useFormAlert";

export type InvoicePaymentRow = {
  id: string;
  amount: { toString(): string };
  paidAt: Date;
  receiptNumber: string | null;
  paymentMethod: string | null;
  reference: string | null;
  accountNo: string | null;
  notes: string | null;
};

export function InvoicePaymentsSection({
  invoiceId,
  invoiceNumber,
  invoiceStatus,
  recipientName,
  grandTotal,
  paidTotal,
  remaining,
  payments,
  tenantName,
  tenantLogoUrl,
  tenantBusinessInfo,
}: {
  invoiceId: string;
  invoiceNumber: string | null;
  invoiceStatus: string;
  recipientName: string | null;
  grandTotal: number;
  paidTotal: number;
  remaining: number;
  payments: InvoicePaymentRow[];
  tenantName: string;
  tenantLogoUrl: string | null;
  tenantBusinessInfo: string | null;
}) {
  const [state, formAction] = useFormState(createInvoicePaymentAction, null);
  const [showAdd, setShowAdd] = useState(false);
  useFormAlert(state && "error" in state ? (state as { error: string }) : null);

  useEffect(() => {
    if (state && "success" in state && state.success) {
      setShowAdd(false);
      Swal.fire({
        title: "Payment recorded",
        text: "The receipt has been saved successfully.",
        icon: "success",
        confirmButtonColor: "#0d9488",
      });
    }
  }, [state]);

  const sorted = [...payments].sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());
  const canAddPayment = invoiceStatus !== "DRAFT" && remaining > 0.0001;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm print:hidden">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Payments & receipts</h2>
          <p className="mt-1 text-sm text-slate-600">
            Total due:{" "}
            <span className="font-semibold text-slate-900">
              {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(grandTotal)}
            </span>
            {" · "}
            Paid:{" "}
            <span className="font-semibold text-teal-700">
              {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(paidTotal)}
            </span>
            {" · "}
            Balance:{" "}
            <span className="font-semibold text-slate-900">
              {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(remaining)}
            </span>
          </p>
          {invoiceStatus === "DRAFT" && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-700">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Click &ldquo;Send Invoice&rdquo; above to enable payment recording.
            </div>
          )}
        </div>
        {canAddPayment && (
          <button type="button" onClick={() => setShowAdd(true)} className="btn btn-primary shrink-0">
            Record payment
          </button>
        )}
      </div>

      {showAdd && (
        <AddPaymentModal
          invoiceId={invoiceId}
          maxAmount={remaining}
          formAction={formAction as unknown as (prev: unknown, formData: FormData) => Promise<{ error?: string } | { success?: boolean } | null>}
          onClose={() => setShowAdd(false)}
        />
      )}

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {sorted.map((p) => (
          <PaymentReceiptCard
            key={p.id}
            payment={p}
            invoiceId={invoiceId}
            invoiceNumber={invoiceNumber}
            recipientName={recipientName}
            tenantName={tenantName}
            tenantLogoUrl={tenantLogoUrl}
            tenantBusinessInfo={tenantBusinessInfo}
          />
        ))}
      </div>
      {payments.length === 0 && (
        <p className="mt-6 text-center text-sm text-slate-500">No payments yet. Record a payment to generate a receipt.</p>
      )}
    </div>
  );
}

function PaymentSlipBody({
  paidDate,
  amountFormatted,
  payment,
  invoiceLabel,
  recipientName,
  tenantName,
  tenantLogoUrl,
  copyLabel,
}: {
  paidDate: string;
  amountFormatted: string;
  payment: InvoicePaymentRow;
  invoiceLabel: string;
  recipientName: string | null;
  tenantName: string;
  tenantLogoUrl: string | null;
  tenantBusinessInfo: string | null;
  copyLabel?: string;
}) {
  return (
    <div className="receipt-slip font-sans" style={{ background: "#fff", display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <div style={{ background: "linear-gradient(90deg,#0d9488,#0891b2)", height: 6 }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "12px 20px 10px", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {tenantLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
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
            <span style={{ fontWeight: 900, color: "#0f172a", fontFamily: "monospace" }}>{payment.receiptNumber ?? "—"}</span>
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
              { label: "Received with thanks from", value: recipientName ?? "—", bold: true },
              { label: "For invoice", value: invoiceLabel + (payment.notes ? ` — ${payment.notes}` : ""), bold: true },
              { label: "Payment method", value: payment.paymentMethod ?? "—", bold: false },
              { label: "Account No", value: payment.accountNo ?? "—", bold: false },
              { label: "Reference", value: payment.reference ?? "—", bold: false },
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

function PaymentReceiptCard({
  payment,
  invoiceId,
  invoiceNumber,
  recipientName,
  tenantName,
  tenantLogoUrl,
  tenantBusinessInfo,
}: {
  payment: InvoicePaymentRow;
  invoiceId: string;
  invoiceNumber: string | null;
  recipientName: string | null;
  tenantName: string;
  tenantLogoUrl: string | null;
  tenantBusinessInfo: string | null;
}) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const receiptEl = printRef.current;
    if (!receiptEl) return;

    // Clone receipt into a direct child of body to bypass any print:hidden ancestor
    const clone = document.createElement("div");
    clone.className = "print-this-receipt receipt-two-copies";
    clone.innerHTML = receiptEl.innerHTML;
    document.body.appendChild(clone);
    document.body.classList.add("print-single-receipt");

    window.print();

    document.body.classList.remove("print-single-receipt");
    document.body.removeChild(clone);
  };

  const amount = Number(payment.amount);
  const paidDate = new Date(payment.paidAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const amountFormatted = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
  const invoiceLabel = invoiceNumber || "—";

  const slipProps = {
    paidDate,
    amountFormatted,
    payment,
    invoiceLabel,
    recipientName,
    tenantName,
    tenantLogoUrl,
    tenantBusinessInfo,
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm print:rounded-none print:border-0 print:shadow-none">
      <div className="receipt-slip-wrapper print:hidden">
        <PaymentSlipBody {...slipProps} />
      </div>
      <div ref={printRef} className="hidden print:!block receipt-two-copies" aria-hidden>
        <div className="receipt-copy">
          <PaymentSlipBody {...slipProps} copyLabel="Customer copy" />
        </div>
        <div className="receipt-copy">
          <PaymentSlipBody {...slipProps} copyLabel="Office copy" />
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-4 py-3 print:hidden">
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
            <path d="M6 9V2h12v7" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <path d="M6 14h12v8H6z" />
          </svg>
          Print receipt
        </button>
        <form action={deleteInvoicePaymentAction} className="inline">
          <input type="hidden" name="invoiceId" value={invoiceId} />
          <input type="hidden" name="paymentId" value={payment.id} />
          <button
            type="submit"
            className="rounded p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
            aria-label="Remove payment"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              <line x1="10" x2="10" y1="11" y2="17" />
              <line x1="14" x2="14" y1="11" y2="17" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}

function AddPaymentModal({
  invoiceId,
  maxAmount,
  formAction,
  onClose,
}: {
  invoiceId: string;
  maxAmount: number;
  formAction: (prev: unknown, formData: FormData) => Promise<{ error?: string } | { success?: boolean } | null>;
  onClose: () => void;
}) {
  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-payment-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <h2 id="add-payment-title" className="text-lg font-semibold text-slate-800">
          Record payment
        </h2>
        <p className="mt-1 text-sm text-slate-500">Balance due: {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(maxAmount)}</p>
        <form action={formAction as unknown as (formData: FormData) => void} className="mt-4 space-y-4">
          <input type="hidden" name="invoiceId" value={invoiceId} />
          <AddPaymentFields onClose={onClose} maxAmount={maxAmount} />
        </form>
      </div>
    </div>
  );
  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : null;
}

function AddPaymentFields({ onClose, maxAmount }: { onClose: () => void; maxAmount: number }) {
  const { pending } = useFormStatus();
  const [rawValue, setRawValue] = useState("");

  const entered = parseFloat(rawValue);
  const isOverMax = !isNaN(entered) && entered > maxAmount + 0.001;
  const isBelowMin = !isNaN(entered) && entered <= 0;
  const hasError = isOverMax || isBelowMin;

  const fmtMax = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(maxAmount);

  return (
    <>
      {pending && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/80" aria-live="polite" aria-busy="true">
          <div className="flex flex-col items-center gap-3">
            <svg className="h-10 w-10 animate-spin text-teal-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-sm font-medium text-slate-700">Saving…</span>
          </div>
        </div>
      )}
      <fieldset disabled={pending} className="space-y-4">
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label htmlFor="pay-amount" className="text-sm font-medium text-slate-700">
              Amount
            </label>
            <button
              type="button"
              onClick={() => setRawValue(maxAmount.toFixed(2))}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 hover:underline"
            >
              Pay full balance ({fmtMax})
            </button>
          </div>
          <input
            id="pay-amount"
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            max={maxAmount}
            required
            placeholder="0.00"
            value={rawValue}
            onChange={(e) => setRawValue(e.target.value)}
            className={`input w-full transition-colors ${hasError ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-200" : ""}`}
          />
          {isOverMax && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-red-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Exceeds balance due of {fmtMax}
            </p>
          )}
          {isBelowMin && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-red-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Amount must be greater than zero
            </p>
          )}
          {!hasError && !isNaN(entered) && entered > 0 && (
            <p className="mt-1.5 text-xs text-slate-500">
              Remaining after this payment:{" "}
              <span className="font-semibold text-slate-700">
                {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Math.max(0, maxAmount - entered))}
              </span>
            </p>
          )}
        </div>
        <div>
          <label htmlFor="pay-paidAt" className="mb-1 block text-sm font-medium text-slate-700">
            Date received
          </label>
          <input
            id="pay-paidAt"
            name="paidAt"
            type="date"
            className="input w-full"
            defaultValue={new Date().toISOString().slice(0, 10)}
          />
        </div>
        <div>
          <label htmlFor="pay-method" className="mb-1 block text-sm font-medium text-slate-700">
            Payment method
          </label>
          <input
            id="pay-method"
            name="paymentMethod"
            type="text"
            placeholder="e.g. Cash, Bank transfer"
            className="input w-full"
          />
        </div>
        <div>
          <label htmlFor="pay-account" className="mb-1 block text-sm font-medium text-slate-700">
            Account No
          </label>
          <input id="pay-account" name="accountNo" type="text" placeholder="Optional" className="input w-full" />
        </div>
        <div>
          <label htmlFor="pay-ref" className="mb-1 block text-sm font-medium text-slate-700">
            Reference
          </label>
          <input id="pay-ref" name="reference" type="text" placeholder="Optional" className="input w-full" />
        </div>
        <div>
          <label htmlFor="pay-notes" className="mb-1 block text-sm font-medium text-slate-700">
            Notes
          </label>
          <input id="pay-notes" name="notes" type="text" placeholder="Optional" className="input w-full" />
        </div>
        <div className="flex gap-2 pt-2">
          <button type="submit" className="btn btn-primary inline-flex items-center gap-2" disabled={pending || hasError || !rawValue}>
            {pending ? "Saving…" : "Save payment"}
          </button>
          <button type="button" onClick={onClose} className="btn btn-secondary" disabled={pending}>
            Cancel
          </button>
        </div>
      </fieldset>
    </>
  );
}
