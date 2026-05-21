"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@imagekit/next";
import { createExpenseDocumentAction, deleteExpenseDocumentAction } from "../actions";
import { useFormAlert } from "@/components/useFormAlert";
import { DocumentPreviewModal } from "@/components/DocumentPreviewModal";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];
const ACCEPT = "image/jpeg,image/png,image/gif,image/webp,application/pdf";

type ExpenseItem = {
  id: string;
  materials: string;
  quantity: { toString(): string };
  unitPrice: { toString(): string };
};

type ExpenseDocument = {
  id: string;
  name: string;
  fileUrl: string;
  mimeType: string;
  createdAt: Date;
};

type Expense = {
  id: string;
  title: string;
  amount: { toString(): string };
  expenseDate: Date;
  items: ExpenseItem[];
  documents: ExpenseDocument[];
};

export function ProjectExpensesSection({
  projectId,
  expenses,
  canAddExpense,
  organizationId,
}: {
  projectId: string;
  expenses: Expense[];
  canAddExpense: boolean;
  organizationId: string;
}) {
  const router = useRouter();
  const [previewDoc, setPreviewDoc] = useState<ExpenseDocument | null>(null);
  const [uploadingForExpenseId, setUploadingForExpenseId] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [formState, setFormState] = useState<{ error?: string } | null>(null);
  useFormAlert(formState);

  const getAuth = async () => {
    const res = await fetch("/api/upload-auth");
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Upload auth failed");
    }
    const data = await res.json();
    return {
      signature: data.signature,
      expire: Number(data.expire),
      token: data.token,
      publicKey: data.publicKey,
    };
  };

  const handleExpenseFileChange = async (expenseId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type) && !file.type.startsWith("image/")) {
      alert("Only images (JPEG, PNG, GIF, WebP) and PDF are allowed.");
      e.target.value = "";
      return;
    }
    setUploadingForExpenseId(expenseId);
    setFormState(null);
    try {
      const auth = await getAuth();
      const ext = file.name.split(".").pop() || (file.type === "application/pdf" ? "pdf" : "png");
      const fileName = `organization/${organizationId}/expenses/${expenseId}/doc-${Date.now()}.${ext}`;
      const result = await upload({ file, fileName, ...auth });
      const url = result.url;
      if (!url) throw new Error("No URL returned from upload");
      const formData = new FormData();
      formData.set("expenseId", expenseId);
      formData.set("name", file.name);
      formData.set("fileUrl", url);
      formData.set("mimeType", file.type);
      const state = await createExpenseDocumentAction(null, formData);
      if (state && "error" in state) setFormState(state);
      else router.refresh();
      e.target.value = "";
    } catch (err) {
      console.error(err);
      setFormState({ error: err instanceof Error ? err.message : "Upload failed" });
    } finally {
      setUploadingForExpenseId(null);
    }
  };

  const expensesByDate = expenses.reduce<Record<string, Expense[]>>((acc, e) => {
    const key = new Date(e.expenseDate).toISOString().slice(0, 10);
    if (!acc[key]) acc[key] = [];
    acc[key].push(e);
    return acc;
  }, {});
  const sortedDates = Object.keys(expensesByDate).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          {expenses.length} record{expenses.length !== 1 ? "s" : ""}
          {sortedDates.length > 0 && ` · ${sortedDates.length} date${sortedDates.length !== 1 ? "s" : ""}`}
        </p>
        {canAddExpense ? (
          <Link href={`/expenses/new?projectId=${projectId}`} className="btn btn-primary text-sm w-full sm:w-auto">
            Add expense
          </Link>
        ) : (
          <span className="text-sm text-slate-400">
            {canAddExpense === false ? "Project completed or cancelled" : ""}
          </span>
        )}
      </div>
      <div className="divide-y divide-slate-200">
        {sortedDates.map((dateKey) => {
          const dateExpenses = expensesByDate[dateKey];
          const dateLabel = new Date(dateKey + "Z").toLocaleDateString(undefined, {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
          });
          const dayTotal = dateExpenses.reduce((s, e) => s + Number(e.amount), 0);
          return (
            <details key={dateKey} className="group" open={sortedDates.length <= 3}>
              <summary className="flex cursor-pointer list-none items-center justify-between py-3.5 text-left font-medium text-slate-800 hover:bg-slate-50/50 [&::-webkit-details-marker]:hidden">
                <span className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-90"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                  {dateLabel}
                </span>
                <span className="text-sm font-semibold text-slate-600">
                  {dateExpenses.length} expense{dateExpenses.length !== 1 ? "s" : ""} ·{" "}
                  {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(dayTotal)}
                </span>
              </summary>
              <div className="border-t border-slate-100 bg-slate-50/30 px-2 pb-4 pt-1 sm:px-4">
                {dateExpenses.map((e) => (
                  <div key={e.id} className="mt-4 first:mt-0">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-slate-800">{e.title}</span>
                      <span className="text-sm font-semibold text-slate-900">
                        {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(e.amount))}
                      </span>
                    </div>
                    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                      <table className="w-full min-w-[280px] text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50/80">
                            <th className="px-3 py-2 font-semibold text-slate-700">Material</th>
                            <th className="px-3 py-2 font-semibold text-slate-700">Qty</th>
                            <th className="px-3 py-2 font-semibold text-slate-700">Unit price</th>
                            <th className="px-3 py-2 font-semibold text-slate-700">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {e.items.map((item) => {
                            const qty = Number(item.quantity);
                            const up = Number(item.unitPrice);
                            const rowTotal = qty * up;
                            return (
                              <tr key={item.id} className="border-b border-slate-100 last:border-0">
                                <td className="px-3 py-2 text-slate-800">{item.materials}</td>
                                <td className="px-3 py-2 text-slate-600">{qty}</td>
                                <td className="px-3 py-2 text-slate-600">
                                  {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(up)}
                                </td>
                                <td className="px-3 py-2 font-medium text-slate-900">
                                  {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(rowTotal)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <ExpenseAttachments
                      expenseId={e.id}
                      documents={e.documents}
                      uploading={uploadingForExpenseId === e.id}
                      fileInputRef={(el) => { fileInputRefs.current[e.id] = el; }}
                      onAddClick={() => fileInputRefs.current[e.id]?.click()}
                      onFileChange={(ev) => handleExpenseFileChange(e.id, ev)}
                      onPreview={setPreviewDoc}
                      onDeleteAction={deleteExpenseDocumentAction}
                    />
                  </div>
                ))}
              </div>
            </details>
          );
        })}
      </div>
      {expenses.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-slate-500">No expenses for this project</p>
          {canAddExpense && (
            <Link
              href={`/expenses/new?projectId=${projectId}`}
              className="mt-3 text-sm font-medium text-teal-600 hover:text-teal-700"
            >
              Add expense
            </Link>
          )}
        </div>
      )}

      {previewDoc && (
        <DocumentPreviewModal
          document={previewDoc}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
}

function ExpenseAttachments({
  expenseId,
  documents,
  uploading,
  fileInputRef,
  onAddClick,
  onFileChange,
  onPreview,
  onDeleteAction,
}: {
  expenseId: string;
  documents: ExpenseDocument[];
  uploading: boolean;
  fileInputRef: (el: HTMLInputElement | null) => void;
  onAddClick: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPreview: (doc: ExpenseDocument) => void;
  onDeleteAction: (formData: FormData) => Promise<void>;
}) {
  const isImage = (mime: string) => mime.startsWith("image/");
  const isPdf = (mime: string) => mime === "application/pdf";
  return (
    <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50/50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-600">Attachments</span>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={onFileChange}
            disabled={uploading}
          />
          <button
            type="button"
            onClick={onAddClick}
            className="text-xs font-medium text-teal-600 hover:text-teal-700 disabled:opacity-50"
          >
            {uploading ? "Uploading…" : "+ Add file (image/PDF)"}
          </button>
        </div>
      </div>
      {documents.length === 0 ? (
        <p className="text-xs text-slate-500">No files attached</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {documents.map((doc) => (
            <li key={doc.id} className="flex items-center gap-1.5 rounded border border-slate-200 bg-white px-2 py-1.5 text-xs">
              {isImage(doc.mimeType) ? (
                <button type="button" onClick={() => onPreview(doc)} className="shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={doc.fileUrl} alt="" className="h-8 w-8 rounded object-cover" />
                </button>
              ) : isPdf(doc.mimeType) ? (
                <button
                  type="button"
                  onClick={() => onPreview(doc)}
                  className="flex h-8 w-8 items-center justify-center rounded bg-red-50 text-red-600"
                >
                  <span className="font-bold">PDF</span>
                </button>
              ) : null}
              <button type="button" onClick={() => onPreview(doc)} className="min-w-0 truncate text-left text-slate-700 hover:underline">
                {doc.name}
              </button>
              <form action={onDeleteAction} className="inline">
                <input type="hidden" name="documentId" value={doc.id} />
                <button type="submit" className="rounded p-0.5 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Delete">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                    <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                  </svg>
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
