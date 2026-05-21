"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { createMaterialAndReturnAction, type CreatedMaterial } from "@/app/(tenant)/(app)/materials/actions";
import { useFormAlert } from "@/components/useFormAlert";

const ADD_NEW_CATEGORY_VALUE = "__add_new_category__";

function AddMaterialModalFormFields({
  category,
  categories,
  onCategoryChange,
  onCancel,
}: {
  category: string;
  categories: string[];
  onCategoryChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onCancel: () => void;
}) {
  const { pending } = useFormStatus();
  return (
    <fieldset disabled={pending} className="space-y-4">
      <div>
        <label htmlFor="add-material-name" className="mb-1 block text-sm font-medium text-slate-700">
          Material name
        </label>
        <input
          id="add-material-name"
          name="name"
          required
          className="input w-full"
          placeholder="e.g. Cement, Steel rebar"
        />
      </div>
      <div>
        <label htmlFor="add-material-category" className="mb-1 block text-sm font-medium text-slate-700">
          Category
        </label>
        <select
          id="add-material-category"
          value={category}
          onChange={onCategoryChange}
          className="input w-full"
          aria-label="Category"
        >
          <option value="">Select category (optional)</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
          <option value={ADD_NEW_CATEGORY_VALUE}>+ Add new category</option>
        </select>
        <input type="hidden" name="category" value={category} />
      </div>
      <div>
        <label htmlFor="add-material-unit" className="mb-1 block text-sm font-medium text-slate-700">
          Unit
        </label>
        <input
          id="add-material-unit"
          name="unit"
          required
          className="input w-full"
          placeholder="e.g. kg, m², bags"
        />
      </div>
      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          className="btn btn-primary inline-flex items-center gap-2"
          disabled={pending}
        >
          {pending && (
            <svg
              className="h-4 w-4 shrink-0 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
          {pending ? "Adding…" : "Add material"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="btn btn-secondary"
        >
          Cancel
        </button>
      </div>
    </fieldset>
  );
}

function NewCategoryModal({
  value,
  onChange,
  onConfirm,
  onCancel,
  onBackdropClick,
}: {
  value: string;
  onChange: (v: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  onBackdropClick: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-category-title-inline"
      onClick={onBackdropClick}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="new-category-title-inline" className="text-lg font-semibold text-slate-800">
          New category
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Enter a category name. It will be saved with this material.
        </p>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), onConfirm())}
          placeholder="e.g. Concrete, Steel, Electrical"
          className="input mt-4 w-full"
          autoFocus
        />
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="btn btn-secondary">
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!value.trim()}
            className="btn btn-primary disabled:opacity-50"
          >
            Use this category
          </button>
        </div>
      </div>
    </div>
  );
}

export function AddMaterialModal({
  initialCategories = [],
  onSuccess,
  onClose,
}: {
  initialCategories?: string[];
  onSuccess: (material: CreatedMaterial) => void;
  onClose: () => void;
}) {
  const [state, formAction] = useFormState(createMaterialAndReturnAction, null);
  useFormAlert(
    state && "error" in state ? (state as { error: string }) : null
  );

  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState<string[]>(initialCategories);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const lastConsumedRef = useRef<typeof state>(undefined);

  useEffect(() => {
    if (state && "material" in state && state !== lastConsumedRef.current) {
      lastConsumedRef.current = state;
      onSuccess(state.material);
      onClose();
    }
  }, [state, onSuccess, onClose]);

  const handleCategoryChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const v = e.target.value;
      if (v === ADD_NEW_CATEGORY_VALUE) {
        setShowCategoryModal(true);
        return;
      }
      setCategory(v);
    },
    []
  );

  const closeCategoryModal = useCallback(() => {
    setShowCategoryModal(false);
    setNewCategoryName("");
  }, []);

  const addNewCategory = useCallback(() => {
    const name = newCategoryName.trim();
    if (!name) return;
    if (!categories.includes(name)) {
      setCategories((prev) => [...prev, name].sort((a, b) => a.localeCompare(b)));
    }
    setCategory(name);
    closeCategoryModal();
  }, [newCategoryName, categories, closeCategoryModal]);

  const modalContent = (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-material-title"
        onClick={onClose}
      >
        <div
          className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 id="add-material-title" className="text-lg font-semibold text-slate-800">
            Add new material
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Add a material to the catalog. It will be selected for this row.
          </p>
          <form action={formAction} className="mt-6" onSubmit={(e) => e.stopPropagation()}>
            <AddMaterialModalFormFields
              category={category}
              categories={categories}
              onCategoryChange={handleCategoryChange}
              onCancel={onClose}
            />
          </form>
        </div>
      </div>

      {showCategoryModal && (
        <NewCategoryModal
          value={newCategoryName}
          onChange={setNewCategoryName}
          onConfirm={addNewCategory}
          onCancel={closeCategoryModal}
          onBackdropClick={closeCategoryModal}
        />
      )}
    </>
  );

  return typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : null;
}
