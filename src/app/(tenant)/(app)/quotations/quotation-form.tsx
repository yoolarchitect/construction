"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { SearchableSelect } from "@/components/SearchableSelect";
import { useFormAlert } from "@/components/useFormAlert";
import { createQuotation, updateQuotation } from "./actions";

type Project = { id: string; name: string };
type Company = { id: string; name: string; logoUrl: string | null; isDefault: boolean };
type QuotationItemInput = { id: string; description: string; quantity: number; unitPrice: number };

type QuotationData = {
  id: string;
  quotationNumber: string | null;
  projectId: string | null;
  companyId: string | null;
  issueDate: Date;
  validUntil: Date;
  recipientName: string | null;
  recipientAddress: string | null;
  notes: string | null;
  terms: string | null;
  discount: unknown;
  status: string;
  items: { id: string; description: string; quantity: unknown; unitPrice: unknown }[];
};

export type QuotationFormProps = {
  projects: Project[];
  companies: Company[];
  nextQuotationNumber?: string;
  quotation?: QuotationData;
};

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-xl bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-teal-700 disabled:opacity-60"
    >
      {pending ? "Saving..." : isEdit ? "Update Quotation" : "Create Quotation"}
    </button>
  );
}

export function QuotationForm({ projects, companies, nextQuotationNumber, quotation }: QuotationFormProps) {
  const isEdit = !!quotation;
  const [state, formAction] = useFormState(
    isEdit ? updateQuotation.bind(null, quotation.id) : createQuotation,
    null
  );
  useFormAlert(state);
  const router = useRouter();

  const defaultCompany = companies.find((c) => c.isDefault);
  const [projectId, setProjectId] = useState(quotation?.projectId || "");
  const [companyId, setCompanyId] = useState(quotation?.companyId || defaultCompany?.id || "");
  const [quotationNumber, setQuotationNumber] = useState(quotation?.quotationNumber || nextQuotationNumber || "");
  const [recipientName, setRecipientName] = useState(quotation?.recipientName || "");
  const [recipientAddress, setRecipientAddress] = useState(quotation?.recipientAddress || "");
  const [notes, setNotes] = useState(quotation?.notes || "");
  const [issueDate, setIssueDate] = useState(() =>
    (quotation?.issueDate ? new Date(quotation.issueDate) : new Date()).toISOString().slice(0, 10)
  );
  const [validUntil, setValidUntil] = useState(() =>
    (quotation?.validUntil
      ? new Date(quotation.validUntil)
      : new Date(Date.now() + 30 * 86400000)
    ).toISOString().slice(0, 10)
  );
  const [terms, setTerms] = useState(quotation?.terms || "");
  const [discount, setDiscount] = useState<number>(quotation ? Number(quotation.discount) : 0);
  const [status, setStatus] = useState(quotation?.status || "DRAFT");
  const [showAdjustments, setShowAdjustments] = useState(Boolean(quotation ? Number(quotation.discount) : 0));
  const [showTerms, setShowTerms] = useState(Boolean(quotation?.terms));

  const [items, setItems] = useState<QuotationItemInput[]>(() =>
    quotation
      ? quotation.items.map((it) => ({
          id: it.id,
          description: it.description,
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
        }))
      : [{ id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0 }]
  );

  const projectOptions = useMemo(
    () => [{ value: "", label: "No Project" }, ...projects.map((p) => ({ value: p.id, label: p.name }))],
    [projects]
  );
  const companyOptions = useMemo(() => companies.map((c) => ({ value: c.id, label: c.name })), [companies]);

  useEffect(() => {
    if (state?.success) router.push("/quotations");
  }, [state, router]);

  const subtotal = items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
  const total = subtotal - discount;

  const addItem = () =>
    setItems((prev) => [...prev, { id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0 }]);
  const removeItem = (id: string) =>
    setItems((prev) => (prev.length <= 1 ? prev : prev.filter((x) => x.id !== id)));
  const updateItem = (id: string, patch: Partial<Omit<QuotationItemInput, "id">>) =>
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const wrappedFormAction = (fd: FormData) => {
    fd.append("items", JSON.stringify(items.map(({ id, ...rest }) => rest)));
    fd.append("discount", String(discount));
    fd.append("status", status);
    fd.append("terms", terms);
    fd.append("notes", notes);
    formAction(fd);
  };

  return (
    <form action={wrappedFormAction} className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Basics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700">Issuing Company</label>
                <SearchableSelect
                  name="companyId"
                  value={companyId}
                  onChange={setCompanyId}
                  options={companyOptions}
                  placeholder="Select Company"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700">Quotation Number</label>
                <input
                  type="text"
                  name="quotationNumber"
                  required
                  value={quotationNumber}
                  onChange={(e) => setQuotationNumber(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 shadow-sm focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700">Issue Date</label>
                <input
                  type="date"
                  name="issueDate"
                  required
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700">Valid Until</label>
                <input
                  type="date"
                  name="validUntil"
                  required
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 shadow-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700">Recipient Name</label>
                <input
                  type="text"
                  name="recipientName"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 shadow-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700">Recipient Address (optional)</label>
                <textarea
                  name="recipientAddress"
                  rows={2}
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 shadow-sm resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700">Status</label>
                <select
                  name="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 shadow-sm"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="SENT">Sent</option>
                  <option value="ACCEPTED">Accepted</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="EXPIRED">Expired</option>
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-6">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Line Items</h2>
              <button
                type="button"
                onClick={() => setShowAdjustments((v) => !v)}
                className="text-xs font-semibold text-slate-600 hover:text-teal-700 hover:bg-slate-50 px-3 py-2 rounded-xl transition-colors border border-slate-200"
              >
                {showAdjustments ? "Hide discount" : "Add discount"}
              </button>
            </div>

            <div className="space-y-3">
              {items.map((it) => (
                <div key={it.id} className="flex flex-wrap sm:flex-nowrap items-end gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Description</label>
                    <input
                      type="text"
                      value={it.description}
                      onChange={(e) => updateItem(it.id, { description: e.target.value })}
                      required
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="w-24">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Qty</label>
                    <input
                      type="number"
                      step="0.01"
                      value={it.quantity}
                      onChange={(e) => updateItem(it.id, { quantity: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="w-32">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Unit Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={it.unitPrice}
                      onChange={(e) => updateItem(it.id, { unitPrice: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="w-32 text-right px-4 py-2 bg-white rounded-lg border border-slate-200">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Amount</label>
                    <span className="text-sm font-bold text-slate-900">${(it.quantity * it.unitPrice).toLocaleString()}</span>
                  </div>
                  <button type="button" onClick={() => removeItem(it.id)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg">
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addItem}
                className="w-full rounded-xl border-2 border-dashed border-teal-100 px-4 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50"
              >
                Add line item
              </button>
            </div>

            {showAdjustments && (
              <div className="mt-8 max-w-xs">
                <label className="block text-sm font-semibold text-slate-700">Discount</label>
                <input
                  type="number"
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5"
                />
              </div>
            )}

            <div className="mt-8 flex justify-end">
              <div className="text-right space-y-1">
                <div className="flex justify-between gap-12 text-sm text-slate-500">
                  <span>Subtotal</span>
                  <span>${subtotal.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between gap-12 text-sm text-red-500">
                    <span>Discount</span>
                    <span>-${discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200">
                  <div className="flex justify-between gap-12">
                    <span className="text-xs text-slate-500">Total</span>
                    <div className="text-3xl font-black text-slate-900">${total.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Notes (optional)</h2>
            <textarea
              name="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Scope of work, assumptions, or additional information..."
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 shadow-sm resize-none"
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Project (optional)</h2>
            <SearchableSelect
              name="projectId"
              value={projectId}
              onChange={setProjectId}
              options={projectOptions}
              placeholder="Select project"
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Terms</h2>
              <button
                type="button"
                onClick={() => setShowTerms((v) => !v)}
                className="text-xs font-semibold text-slate-600 hover:text-teal-700 hover:bg-slate-50 px-3 py-2 rounded-xl transition-colors border border-slate-200"
              >
                {showTerms ? "Hide" : "Add"}
              </button>
            </div>
            {showTerms && (
              <div className="mt-4">
                <textarea
                  name="terms"
                  rows={6}
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 shadow-sm resize-none"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-4">
        <button
          type="button"
          onClick={() => router.push("/quotations")}
          className="px-6 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
        >
          Cancel
        </button>
        <SubmitButton isEdit={isEdit} />
      </div>
    </form>
  );
}
