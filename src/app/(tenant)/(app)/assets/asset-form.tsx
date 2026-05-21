"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createAssetAction, updateAssetAction } from "./actions";
import Link from "next/link";
import { useFormAlert } from "@/components/useFormAlert";
import { SearchableSelect } from "@/components/SearchableSelect";
import { useState } from "react";

const CATEGORIES = [
  { value: "FIXED", label: "Fixed Asset" },
  { value: "CURRENT", label: "Current Asset" },
] as const;

type AssetForForm = {
  id: string;
  name: string;
  category: string;
  cost: { toString(): string };
  companyId?: string | null;
};

type Company = { id: string; name: string; isDefault?: boolean };

export function AssetForm({ 
  asset, 
  companies = [] 
}: { 
  asset?: AssetForForm;
  companies?: Company[];
}) {
  const [state, formAction] = useFormState(
    asset ? updateAssetAction : createAssetAction,
    null
  );
  useFormAlert(state);

  const defaultCompany = companies.find(c => c.isDefault);
  const [companyId, setCompanyId] = useState(asset?.companyId ?? defaultCompany?.id ?? "");

  const companyOptions = companies.map(c => ({ value: c.id, label: c.name }));

  return (
    <div className="card !p-10 mx-auto max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10">
         <h1 className="page-title text-3xl mb-2">{asset ? "Edit Asset" : "Register New Asset"}</h1>
         <p className="page-subtitle text-base">Log business assets and their current valuation for balance sheet accuracy.</p>
      </div>

      <form action={formAction} className="space-y-8">
        {asset && <input type="hidden" name="id" value={asset.id} />}
        
        <div className="group">
          <label htmlFor="name" className="label italic">Asset Description / Name</label>
          <input
            id="name"
            name="name"
            required
            className="input text-lg font-bold"
            placeholder="e.g. Caterpillar Excavator 320, Headquarters HQ"
            defaultValue={asset?.name}
          />
        </div>

        <div className="group">
          <label htmlFor="companyId" className="label italic">Issuing Internal Entity</label>
          <SearchableSelect
            name="companyId"
            value={companyId}
            onChange={setCompanyId}
            options={companyOptions}
            placeholder="Select entity"
            className="w-full"
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
           <div className="group">
            <label htmlFor="category" className="label">Financial Classification</label>
            <div className="relative">
              <select
                id="category"
                name="category"
                className="input appearance-none pr-10 bg-white font-medium"
                defaultValue={asset?.category ?? "FIXED"}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>
          </div>

          <div className="group">
            <label htmlFor="cost" className="label">Purchase Value / Cost (USD)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
              <input
                id="cost"
                name="cost"
                type="number"
                step="0.01"
                min="0"
                required
                className="input pl-10 font-mono font-bold"
                placeholder="0.00"
                defaultValue={asset?.cost != null ? String(asset.cost) : ""}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-50">
          <SubmitButton asset={asset} />
          <Link href="/assets" className="btn btn-secondary py-4 px-8 text-base">
            Discard
          </Link>
        </div>
      </form>
    </div>
  );
}

function SubmitButton({ asset }: { asset?: AssetForForm }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="btn btn-primary flex-1 py-4 text-base shadow-xl shadow-teal-500/20"
      disabled={pending}
    >
      {pending ? (
        <svg className="h-5 w-5 mr-3 animate-spin" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
      )}
      {pending ? (asset ? "Synchronizing..." : "Recording...") : (asset ? "Update Asset" : "Register Asset")}
    </button>
  );
}
