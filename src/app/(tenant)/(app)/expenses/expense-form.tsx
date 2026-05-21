"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { createExpenseAction } from "./actions";
import { SearchableSelect } from "@/components/SearchableSelect";
import { useFormAlert } from "@/components/useFormAlert";
import { AddMaterialModal } from "./add-material-modal";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary inline-flex items-center gap-2" disabled={pending}>
      {pending && (
        <svg className="h-4 w-4 shrink-0 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {pending ? "Adding…" : "Add expense"}
    </button>
  );
}

type Project = { id: string; name: string };

type Material = { id: string; name: string; unit: string; category?: string | null };

type ItemRow = {
  id: string;
  materialId: string;
  qty: string;
  unitPrice: string;
};

const ADD_NEW_MATERIAL_VALUE = "__add_new_material__";

function nextId() {
  return Math.random().toString(36).slice(2, 11);
}

export function ExpenseForm({
  projects,
  materials,
  companies = [],
  defaultProjectId,
}: {
  projects: Project[];
  materials: Material[];
  companies?: { id: string; name: string }[];
  defaultProjectId?: string;
}) {
  const [state, formAction] = useFormState(createExpenseAction, null);
  useFormAlert(state);
  const [projectId, setProjectId] = useState(defaultProjectId ?? "");
  const [companyId, setCompanyId] = useState("");
  const [materialsList, setMaterialsList] = useState<Material[]>(materials);
  const [items, setItems] = useState<ItemRow[]>([
    { id: nextId(), materialId: "", qty: "", unitPrice: "" },
  ]);
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [addMaterialForRowId, setAddMaterialForRowId] = useState<string | null>(null);

  const projectOptions = projects.map((p) => ({ value: p.id, label: p.name }));
  const companyOptions = [
    { value: "", label: "Main Entity" },
    ...companies.map((c) => ({ value: c.id, label: c.name })),
  ];
  const allMaterialOptions = useMemo(
    () =>
      materialsList.map((m) => ({
        value: m.id,
        label: `${m.name} (${m.unit})${m.category ? ` · ${m.category}` : ""}`,
      })),
    [materialsList]
  );

  const initialCategories = useMemo(
    () =>
      Array.from(new Set(materialsList.map((m) => m.category).filter(Boolean))).sort() as string[],
    [materialsList]
  );

  const getMaterialOptionsForRow = useCallback(
    (rowId: string) => {
      const selectedInOtherRows = new Set(
        items.filter((r) => r.id !== rowId && r.materialId).map((r) => r.materialId)
      );
      const currentRowMaterialId = items.find((r) => r.id === rowId)?.materialId;
      const base = allMaterialOptions.filter(
        (opt) =>
          opt.value === currentRowMaterialId || !selectedInOtherRows.has(opt.value)
      );
      return [
        ...base,
        { value: ADD_NEW_MATERIAL_VALUE, label: "+ Add new material" },
      ];
    },
    [items, allMaterialOptions]
  );

  const addRow = useCallback(() => {
    setItems((prev) => [...prev, { id: nextId(), materialId: "", qty: "", unitPrice: "" }]);
  }, []);

  const removeRow = useCallback((id: string) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  }, []);

  const updateRow = useCallback((id: string, field: keyof ItemRow, value: string) => {
    setItems((prev) => {
      const updated = prev.map((r) => (r.id === id ? { ...r, [field]: value } : r));
      if (field !== "materialId") return updated;
      const idx = updated.findIndex((r) => r.id === id);
      if (idx < 0 || idx >= updated.length - 1) return updated;
      const next = updated[idx + 1];
      const nextEmpty =
        !next.materialId &&
        (next.qty === "" || Number.isNaN(parseFloat(next.qty)) || parseFloat(next.qty) === 0) &&
        (next.unitPrice === "" || Number.isNaN(parseFloat(next.unitPrice)) || parseFloat(next.unitPrice) === 0);
      if (nextEmpty && updated.length > 1) {
        return updated.filter((r) => r.id !== next.id);
      }
      return updated;
    });
  }, []);

  const handleMaterialSelectChange = useCallback(
    (rowId: string, value: string) => {
      if (value === ADD_NEW_MATERIAL_VALUE) {
        setAddMaterialForRowId(rowId);
        setShowAddMaterialModal(true);
        return;
      }
      updateRow(rowId, "materialId", value);
    },
    [updateRow]
  );

  const handleAddMaterialSuccess = useCallback(
    (material: Material) => {
      setMaterialsList((prev) => [...prev, material]);
      if (addMaterialForRowId) {
        updateRow(addMaterialForRowId, "materialId", material.id);
      }
      setAddMaterialForRowId(null);
      setShowAddMaterialModal(false);
    },
    [addMaterialForRowId, updateRow]
  );

  const totalFor = (qty: string, unitPrice: string) => {
    const q = parseFloat(qty);
    const u = parseFloat(unitPrice);
    if (Number.isNaN(q) || Number.isNaN(u)) return "";
    return (q * u).toFixed(2);
  };

  const inputUnderline =
    "w-full min-w-0 border-0 border-b border-slate-300 bg-transparent px-0 py-1.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-0";

  return (
    <form action={formAction} className="max-w-4xl space-y-6">
      {/* Header: Project + Company + Date */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="projectId" className="mb-1 block text-sm font-medium text-slate-700">
            Project
          </label>
          <SearchableSelect
            name="projectId"
            value={projectId}
            onChange={setProjectId}
            options={projectOptions}
            placeholder="Select project"
            required
          />
        </div>
        <div>
          <label htmlFor="companyId" className="mb-1 block text-sm font-medium text-slate-700">
            Issuing Entity
          </label>
          <SearchableSelect
            name="companyId"
            value={companyId}
            onChange={setCompanyId}
            options={companyOptions}
            placeholder="Main Entity"
          />
        </div>
        <div>
          <label htmlFor="expenseDate" className="mb-1 block text-sm font-medium text-slate-700">
            Date
          </label>
          <input
            id="expenseDate"
            name="expenseDate"
            type="date"
            required
            className="input w-full"
            defaultValue={new Date().toISOString().slice(0, 10)}
          />
        </div>
      </div>

      {/* Items table */}
      <div>
        <div className="mb-2">
          <span className="text-sm font-semibold text-slate-700">Items</span>
        </div>
        <div className="table-wrap border-0 shadow-none">
          <table>
            <thead>
              <tr>
                <th>Material</th>
                <th>Qty</th>
                <th>Unit price</th>
                <th>Total</th>
                <th className="w-24"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id}>
                  <td className="min-w-[140px]">
                    <SearchableSelect
                      name="materialId"
                      value={row.materialId}
                      onChange={(v) => handleMaterialSelectChange(row.id, v)}
                      options={getMaterialOptionsForRow(row.id)}
                      placeholder="Select material"
                      required
                      className="min-w-[140px]"
                      inputClassName={inputUnderline + " min-w-[140px] cursor-pointer rounded-none"}
                    />
                  </td>
                  <td className="min-w-[80px]">
                    <input
                      name="qty"
                      type="number"
                      step="0.0001"
                      min="0"
                      className={inputUnderline}
                      placeholder="0"
                      value={row.qty}
                      onChange={(e) => updateRow(row.id, "qty", e.target.value)}
                    />
                  </td>
                  <td className="min-w-[90px]">
                    <input
                      name="unitPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      className={inputUnderline}
                      placeholder="0.00"
                      value={row.unitPrice}
                      onChange={(e) => updateRow(row.id, "unitPrice", e.target.value)}
                    />
                  </td>
                  <td className="text-slate-600 font-medium">
                    {totalFor(row.qty, row.unitPrice) ? (
                      new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
                        parseFloat(totalFor(row.qty, row.unitPrice))
                      )
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="w-24">
                    <span className="flex items-center justify-center gap-0.5">
                      <button
                        type="button"
                        onClick={addRow}
                        className="flex items-center justify-center rounded p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-teal-600"
                        aria-label="Add row"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                          <path d="M5 12h14" />
                          <path d="M12 5v14" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeRow(row.id)}
                        className="flex items-center justify-center rounded p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        aria-label="Remove row"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          <line x1="10" x2="10" y1="11" y2="17" />
                          <line x1="14" x2="14" y1="11" y2="17" />
                        </svg>
                      </button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {materialsList.length === 0 && (
          <p className="mt-2 text-sm text-amber-600">
            No materials in catalog. Use &quot;+ Add new material&quot; in the dropdown or <Link href="/materials/new" className="underline">add materials</Link> first.
          </p>
        )}
      </div>

      {showAddMaterialModal && (
        <AddMaterialModal
          initialCategories={initialCategories}
          onSuccess={handleAddMaterialSuccess}
          onClose={() => {
            setShowAddMaterialModal(false);
            setAddMaterialForRowId(null);
          }}
        />
      )}

      <div className="flex gap-2">
        <SubmitButton />
        <Link href="/expenses" className="btn btn-secondary">
          Cancel
        </Link>
      </div>
    </form>
  );
}
