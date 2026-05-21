"use client";

import { useFormState, useFormStatus } from "react-dom";
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
  notes: string | null;
};

export function ProjectDepositsReceiptsSection({
  projectId,
  deposits,
}: {
  projectId: string;
  deposits: Deposit[];
}) {
  const [state, formAction] = useFormState(createProjectDepositAction, null);
  useFormAlert(state && "error" in state ? (state as { error: string }) : null);

  const sortedDeposits = [...deposits].sort(
    (a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime()
  );
  const totalDeposits = deposits.reduce((s, d) => s + Number(d.amount), 0);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Deposits &amp; receipts</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Money received for this project. Use receipt # for tracking.
          </p>
        </div>
        <p className="text-sm font-semibold text-slate-700">
          Total received: {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(totalDeposits)}
        </p>
      </div>
      <div className="p-5">
        <AddDepositForm
          projectId={projectId}
          formAction={formAction as unknown as (prev: unknown, formData: FormData) => Promise<{ error?: string } | { success?: boolean } | null>}
        />
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th className="px-4 py-3 font-semibold text-slate-700">Receipt #</th>
                <th className="px-4 py-3 font-semibold text-slate-700 text-right">Amount</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Date</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Reference</th>
                <th className="w-20 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {sortedDeposits.map((d) => (
                <tr key={d.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {d.receiptNumber ? `#${d.receiptNumber}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900">
                    {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(d.amount))}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(d.paidAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{d.reference ?? "—"}</td>
                  <td className="px-4 py-3">
                    <form action={deleteProjectDepositAction} className="inline">
                      <input type="hidden" name="projectId" value={projectId} />
                      <input type="hidden" name="depositId" value={d.id} />
                      <button
                        type="submit"
                        className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        aria-label="Remove deposit"
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {deposits.length === 0 && (
          <p className="mt-4 text-center text-sm text-slate-500">No deposits yet. Add one above.</p>
        )}
      </div>
    </div>
  );
}

function AddDepositForm({
  projectId,
  formAction,
}: {
  projectId: string;
  formAction: (prev: unknown, formData: FormData) => Promise<{ error?: string } | { success?: boolean } | null>;
}) {
  const { pending } = useFormStatus();
  return (
    <form
      action={formAction as unknown as (formData: FormData) => void}
      className="flex flex-wrap items-end gap-3"
    >
      <input type="hidden" name="projectId" value={projectId} />
      <div className="min-w-[100px]">
        <label htmlFor="dep-amount" className="mb-1 block text-xs font-medium text-slate-600">Amount</label>
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
      <div className="min-w-[140px]">
        <label htmlFor="dep-paidAt" className="mb-1 block text-xs font-medium text-slate-600">Date received</label>
        <input
          id="dep-paidAt"
          name="paidAt"
          type="date"
          className="input w-full"
          defaultValue={new Date().toISOString().slice(0, 10)}
        />
      </div>
      <div className="min-w-[120px]">
        <label htmlFor="dep-receiptNumber" className="mb-1 block text-xs font-medium text-slate-600">Receipt #</label>
        <input
          id="dep-receiptNumber"
          name="receiptNumber"
          type="text"
          placeholder="Optional"
          className="input w-full"
        />
      </div>
      <div className="min-w-[140px]">
        <label htmlFor="dep-reference" className="mb-1 block text-xs font-medium text-slate-600">Reference</label>
        <input
          id="dep-reference"
          name="reference"
          type="text"
          placeholder="Check / transaction"
          className="input w-full"
        />
      </div>
      <div className="min-w-[160px] flex-1">
        <label htmlFor="dep-notes" className="mb-1 block text-xs font-medium text-slate-600">Notes</label>
        <input
          id="dep-notes"
          name="notes"
          type="text"
          placeholder="Optional"
          className="input w-full"
        />
      </div>
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Adding…" : "Add deposit"}
      </button>
    </form>
  );
}
