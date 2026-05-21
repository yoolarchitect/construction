"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Swal from "sweetalert2";
import {
  createProjectDepositAction,
  deleteProjectDepositAction,
} from "../actions";
import { useFormAlert } from "@/components/useFormAlert";

type Deposit = {
  id: string;
  amount: { toString(): string };
  paidAt: Date;
  reference: string | null;
  receiptNumber: string | null;
  paymentMethod: string | null;
  accountNo: string | null;
  notes: string | null;
};

export function ProjectReceiptsSection({
  projectId,
  deposits,
  projectName,
  clientName,
  tenantName,
  tenantLogoUrl,
  tenantBusinessInfo,
}: {
  projectId: string;
  deposits: Deposit[];
  projectName: string;
  clientName: string | null;
  tenantName: string;
  tenantLogoUrl: string | null;
  tenantBusinessInfo: string | null;
}) {
  const [state, formAction] = useFormState(createProjectDepositAction, null);
  const [showAddReceiptModal, setShowAddReceiptModal] = useState(false);
  useFormAlert(state && "error" in state ? (state as { error: string }) : null);
  useEffect(() => {
    if (state && "success" in state && state.success) {
      setShowAddReceiptModal(false);
      Swal.fire({
        title: "Receipt added",
        text: "The receipt has been saved successfully.",
        icon: "success",
        confirmButtonColor: "#0d9488",
      });
    }
  }, [state]);

  const sortedDeposits = [...deposits].sort(
    (a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime()
  );
  const totalDeposits = deposits.reduce((s, d) => s + Number(d.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-slate-700">
          Total received: {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(totalDeposits)}
        </p>
        <AddReceiptButton onOpenModal={() => setShowAddReceiptModal(true)} />
      </div>
      {showAddReceiptModal && (
        <AddReceiptModal
          projectId={projectId}
          formAction={formAction as unknown as (prev: unknown, formData: FormData) => Promise<{ error?: string } | { success?: boolean } | null>}
          onClose={() => setShowAddReceiptModal(false)}
        />
      )}
      <div className="grid gap-6 sm:grid-cols-2 print:block print:grid-cols-1">
        {sortedDeposits.map((d) => (
          <ReceiptPaper
            key={d.id}
            deposit={d}
            projectId={projectId}
            projectName={projectName}
            clientName={clientName}
            tenantName={tenantName}
            tenantLogoUrl={tenantLogoUrl}
            tenantBusinessInfo={tenantBusinessInfo}
          />
        ))}
      </div>
      {deposits.length === 0 && (
        <p className="py-8 text-center text-sm text-slate-500">No receipts yet. Add one above.</p>
      )}
    </div>
  );
}

function ReceiptSlipBody({
  paidDate,
  amountFormatted,
  deposit,
  projectName,
  clientName,
  tenantName,
  tenantLogoUrl,
  tenantBusinessInfo,
  copyLabel,
}: {
  paidDate: string;
  amountFormatted: string;
  deposit: Deposit;
  projectName: string;
  clientName: string | null;
  tenantName: string;
  tenantLogoUrl: string | null;
  tenantBusinessInfo: string | null;
  copyLabel?: string;
}) {
  return (
    <div className="receipt-slip bg-[#faf8f5] p-6 min-h-[380px] flex flex-col print:min-h-0 print:p-4">
      {copyLabel && (
        <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-600 print:mb-1">
          {copyLabel}
        </p>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between print:flex-row">
        <div className="flex-shrink-0">
          {tenantLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tenantLogoUrl}
              alt="Company logo"
              className="h-14 w-14 object-contain object-left sm:h-16 sm:w-16 print:h-12 print:w-12"
            />
          ) : (
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded border border-slate-300 bg-white sm:h-16 sm:w-16 print:h-12 print:w-12">
              <span className="text-xs font-medium text-slate-400">Logo</span>
            </div>
          )}
        </div>
        <div className="flex flex-1 justify-center">
          <h2 className="inline-block rounded-lg border-2 border-teal-600 px-4 py-2 text-center text-lg font-bold text-teal-700 sm:text-xl print:text-base">
            MONEY RECEIPT
          </h2>
        </div>
        <div className="flex-shrink-0 text-right">
          <p className="font-semibold text-teal-700">{tenantName}</p>
          {tenantBusinessInfo && (
            <p className="mt-1 max-w-[200px] text-xs leading-snug text-slate-600 sm:max-w-[240px]">
              {tenantBusinessInfo}
            </p>
          )}
          <p className="mt-2 text-sm text-slate-700">
            <span className="font-medium">Date:</span> {paidDate}
          </p>
        </div>
      </div>
      <div className="mt-6 flex-1 space-y-3 text-sm print:mt-4 print:space-y-2">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span className="text-slate-600">Receipt No:</span>
          <span className="font-semibold text-slate-900">{deposit.receiptNumber ?? "—"}</span>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <span className="text-slate-600">Received with thanks from:</span>
          <span className="border-b border-slate-400 border-dotted font-medium text-slate-900">{clientName ?? "—"}</span>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <span className="text-slate-600">Payment method:</span>
          <span className="border-b border-slate-400 border-dotted text-slate-900">{deposit.paymentMethod ?? "—"}</span>
          <span className="ml-2 text-slate-600">Account No:</span>
          <span className="border-b border-slate-400 border-dotted text-slate-900">{deposit.accountNo ?? "—"}</span>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <span className="text-slate-600">Reference:</span>
          <span className="border-b border-slate-400 border-dotted text-slate-900">{deposit.reference ?? "—"}</span>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <span className="text-slate-600">For the purpose of:</span>
          <span className="border-b border-slate-400 border-dotted font-medium text-slate-900">
            {projectName}
            {deposit.notes ? ` — ${deposit.notes}` : ""}
          </span>
        </div>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
          <span className="text-slate-600">Amount:</span>
          <span className="inline-block border-2 border-slate-700 bg-white px-3 py-1.5 font-bold text-slate-900">
            {amountFormatted}
          </span>
        </div>
      </div>
      <div
        className="-mx-6 -mb-6 mt-auto h-4 bg-gradient-to-r from-teal-700 to-teal-500 print:mx-0 print:mb-0 print:mt-4"
        aria-hidden
      />
    </div>
  );
}

function ReceiptPaper({
  deposit,
  projectId,
  projectName,
  clientName,
  tenantName,
  tenantLogoUrl,
  tenantBusinessInfo,
}: {
  deposit: Deposit;
  projectId: string;
  projectName: string;
  clientName: string | null;
  tenantName: string;
  tenantLogoUrl: string | null;
  tenantBusinessInfo: string | null;
}) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const receiptEl = printRef.current;
    if (!receiptEl) return;
    const body = document.body;
    const originalClass = body.className;
    body.classList.add("print-single-receipt");
    receiptEl.classList.add("print-this-receipt");
    window.print();
    body.className = originalClass;
    receiptEl.classList.remove("print-this-receipt");
  };

  const amount = Number(deposit.amount);
  const paidDate = new Date(deposit.paidAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const amountFormatted = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

  const slipProps = {
    paidDate,
    amountFormatted,
    deposit,
    projectName,
    clientName,
    tenantName,
    tenantLogoUrl,
    tenantBusinessInfo,
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm print:rounded-none print:border-0 print:shadow-none">
      {/* On-screen: single receipt */}
      <div id={`receipt-${deposit.id}`} className="receipt-slip-wrapper print:hidden">
        <ReceiptSlipBody {...slipProps} />
      </div>

      {/* Print-only: one page with customer + office copy */}
      <div
        ref={printRef}
        id={`receipt-print-${deposit.id}`}
        className="hidden print:!block receipt-two-copies"
        aria-hidden
      >
        <div className="receipt-copy">
          <ReceiptSlipBody {...slipProps} copyLabel="Customer copy" />
        </div>
        <div className="receipt-copy">
          <ReceiptSlipBody {...slipProps} copyLabel="Office copy" />
        </div>
      </div>

      {/* Actions - hidden when printing */}
      <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 bg-slate-50/50 print:hidden">
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
          Print
        </button>
        <form action={deleteProjectDepositAction} className="inline">
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="depositId" value={deposit.id} />
          <button
            type="submit"
            className="rounded p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
            aria-label="Remove receipt"
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

function AddReceiptButton({ onOpenModal }: { onOpenModal: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpenModal}
      className="btn btn-primary print:hidden"
    >
      Add receipt
    </button>
  );
}

function AddReceiptModal({
  projectId,
  formAction,
  onClose,
}: {
  projectId: string;
  formAction: (prev: unknown, formData: FormData) => Promise<{ error?: string } | { success?: boolean } | null>;
  onClose: () => void;
}) {
  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-receipt-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="add-receipt-title" className="text-lg font-semibold text-slate-800">
          New receipt
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Record a payment received for this project.
        </p>
        <form action={formAction as unknown as (formData: FormData) => void} className="mt-6 space-y-4" onSubmit={(e) => e.stopPropagation()}>
          <input type="hidden" name="projectId" value={projectId} />
          <AddReceiptFormFields onClose={onClose} />
        </form>
      </div>
    </div>
  );
  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : null;
}

function AddReceiptFormFields({ onClose }: { onClose: () => void }) {
  const { pending } = useFormStatus();
  return (
    <>
      {pending && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/80"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="flex flex-col items-center gap-3">
            <svg
              className="h-10 w-10 animate-spin text-teal-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="text-sm font-medium text-slate-700">Submitting receipt…</span>
          </div>
        </div>
      )}
      <fieldset disabled={pending} className="space-y-4">
        <div>
          <label htmlFor="dep-amount" className="mb-1 block text-sm font-medium text-slate-700">Amount</label>
          <input
            id="dep-amount"
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder="0.00"
            className="input w-full"
          />
        </div>
        <div>
          <label htmlFor="dep-paidAt" className="mb-1 block text-sm font-medium text-slate-700">Date received</label>
          <input
            id="dep-paidAt"
            name="paidAt"
            type="date"
            className="input w-full"
            defaultValue={new Date().toISOString().slice(0, 10)}
          />
        </div>
        <div>
          <label htmlFor="dep-paymentMethod" className="mb-1 block text-sm font-medium text-slate-700">Payment method</label>
          <input
            id="dep-paymentMethod"
            name="paymentMethod"
            type="text"
            placeholder="e.g. Cash, Cheque, Bank Transfer"
            className="input w-full"
          />
        </div>
        <div>
          <label htmlFor="dep-accountNo" className="mb-1 block text-sm font-medium text-slate-700">Account No</label>
          <input
            id="dep-accountNo"
            name="accountNo"
            type="text"
            placeholder="Bank / account number"
            className="input w-full"
          />
        </div>
        <div>
          <label htmlFor="dep-reference" className="mb-1 block text-sm font-medium text-slate-700">Reference</label>
          <input
            id="dep-reference"
            name="reference"
            type="text"
            placeholder="Cheque no, transaction ref"
            className="input w-full"
          />
        </div>
        <div>
          <label htmlFor="dep-notes" className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
          <input
            id="dep-notes"
            name="notes"
            type="text"
            placeholder="Optional"
            className="input w-full"
          />
        </div>
        <div className="flex gap-2 pt-2">
          <button type="submit" className="btn btn-primary inline-flex items-center gap-2" disabled={pending}>
            {pending && (
              <svg
                className="h-4 w-4 shrink-0 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            {pending ? "Adding…" : "Add receipt"}
          </button>
          <button type="button" onClick={onClose} className="btn btn-secondary" disabled={pending}>
            Cancel
          </button>
        </div>
      </fieldset>
    </>
  );
}
