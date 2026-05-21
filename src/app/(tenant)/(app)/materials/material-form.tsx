"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createMaterialAction } from "./actions";
import Link from "next/link";
import { useFormAlert } from "@/components/useFormAlert";
import { useState, useCallback } from "react";

const ADD_NEW_VALUE = "__add_new_category__";

function MaterialFormFields({
  category,
  categories,
  onCategoryChange,
  ADD_NEW_VALUE,
}: {
  category: string;
  categories: string[];
  onCategoryChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  ADD_NEW_VALUE: string;
}) {
  const { pending } = useFormStatus();
  return (
    <fieldset disabled={pending} className="space-y-6">
      <div className="group">
        <label htmlFor="name" className="label italic">Material Designation</label>
        <input 
          id="name" 
          name="name" 
          required 
          className="input text-lg font-bold" 
          placeholder="e.g. High-Grade Cement, Structural Steel" 
        />
      </div>
      
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="group">
          <label htmlFor="category" className="label">Inventory Classification</label>
          <div className="relative">
            <select
              id="category"
              value={category}
              onChange={onCategoryChange}
              className="input pr-10 appearance-none bg-white font-medium"
              aria-label="Category"
            >
              <option value="">General / Uncategorized</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              <option value={ADD_NEW_VALUE} className="text-teal-600 font-bold">+ Define New Category</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>
          <input type="hidden" name="category" value={category} />
        </div>

        <div className="group">
          <label htmlFor="unit" className="label">Measurement Unit</label>
          <input 
            id="unit" 
            name="unit" 
            required 
            className="input font-medium" 
            placeholder="e.g. kg, m³, pallets" 
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-50">
        <button
          type="submit"
          className="btn btn-primary flex-1 py-4 text-base shadow-xl shadow-teal-500/20"
          disabled={pending}
        >
          {pending && (
            <svg
              className="h-5 w-5 mr-3 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
          {pending ? "Registering..." : "Add to Catalog"}
        </button>
        <Link href="/materials" className="btn btn-secondary py-4 px-8 text-base">
          Discard
        </Link>
      </div>
    </fieldset>
  );
}

export function MaterialForm({ initialCategories = [] }: { initialCategories?: string[] }) {
  const [state, formAction] = useFormState(createMaterialAction, null);
  useFormAlert(state);

  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState<string[]>(initialCategories);
  const [showModal, setShowModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const handleCategoryChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const v = e.target.value;
      if (v === ADD_NEW_VALUE) {
        setShowModal(true);
        return;
      }
      setCategory(v);
    },
    []
  );

  const closeModal = useCallback(() => {
    setShowModal(false);
    setNewCategoryName("");
  }, []);

  const addNewCategory = useCallback(() => {
    const name = newCategoryName.trim();
    if (!name) return;
    if (!categories.includes(name)) {
      setCategories((prev) => [...prev, name].sort((a, b) => a.localeCompare(b)));
    }
    setCategory(name);
    closeModal();
  }, [newCategoryName, categories, closeModal]);

  return (
    <>
      <div className="card !p-10 mx-auto max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-10 text-center">
           <h1 className="page-title text-3xl mb-2">New Material Entry</h1>
           <p className="page-subtitle">Classify materials for improved procurement tracking</p>
        </div>
        <form action={formAction}>
          <MaterialFormFields
            category={category}
            categories={categories}
            onCategoryChange={handleCategoryChange}
            ADD_NEW_VALUE={ADD_NEW_VALUE}
          />
        </form>
      </div>

      {showModal && (
        <NewCategoryModal
          value={newCategoryName}
          onChange={setNewCategoryName}
          onConfirm={addNewCategory}
          onCancel={closeModal}
          onBackdropClick={closeModal}
        />
      )}
    </>
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-category-title"
      onClick={onBackdropClick}
    >
      <div
        className="w-full max-w-md glass-card !p-10 border-white/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-14 w-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center mb-6 shadow-xl shadow-teal-600/20">
           <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
        </div>
        <h2 id="new-category-title" className="text-2xl font-black text-slate-900 mb-2">
          New Classification
        </h2>
        <p className="text-sm font-medium text-slate-500 leading-relaxed">
          Define a unique category to help organize your inventory and reports effectively.
        </p>
        <div className="mt-8 group">
          <label className="label">Category Label</label>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), onConfirm())}
            placeholder="e.g. Masonry, Electrical, Metals"
            className="input !bg-white/50 !backdrop-blur-none"
            autoFocus
          />
        </div>
        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onConfirm}
            disabled={!value.trim()}
            className="btn btn-primary flex-1 py-4 text-base shadow-lg shadow-teal-500/20"
          >
            Confirm Category
          </button>
          <button type="button" onClick={onCancel} className="btn btn-ghost py-4 text-slate-500 font-bold hover:text-slate-900">
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
