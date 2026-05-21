"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCompany, updateCompany, deleteCompany } from "./actions";

type CompanyFormProps = {
  company?: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    website: string | null;
    taxId: string | null;
    notes: string | null;
    logoUrl: string | null;
  };
  organizationId: string;
};

import { useState, useRef } from "react";
import { upload } from "@imagekit/next";

export function CompanyForm({ company, organizationId }: CompanyFormProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [logoUrl, setLogoUrl] = useState<string | null>(company?.logoUrl || null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

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

  const handleLogoUpload = async () => {
    if (!selectedLogoFile) {
      logoInputRef.current?.click();
      return;
    }
    const ext = selectedLogoFile.name.split(".").pop() || "png";
    const fileName = `companies/${organizationId}/logo-${Date.now()}.${ext}`;
    setLogoUploading(true);
    try {
      const auth = await getAuth();
      const result = await upload({
        file: selectedLogoFile,
        fileName,
        ...auth,
      });
      setLogoUrl(result.url ?? null);
      setSelectedLogoFile(null);
      if (logoInputRef.current) logoInputRef.current.value = "";
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Logo upload failed");
    } finally {
      setLogoUploading(false);
    }
  };

  async function handleSubmit(formData: FormData) {
    if (logoUrl) formData.set("logoUrl", logoUrl);
    startTransition(async () => {
      try {
        if (company) {
          await updateCompany(company.id, formData);
        } else {
          await createCompany(formData);
        }
        router.push("/companies");
      } catch (error: any) {
        alert(error.message);
      }
    });
  }

  async function handleDelete() {
    if (!company) return;
    if (!confirm("Are you sure you want to delete this company?")) return;

    startTransition(async () => {
      try {
        await deleteCompany(company.id);
        router.push("/companies");
      } catch (error: any) {
        alert(error.message);
      }
    });
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <form action={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="name" className="block text-sm font-semibold text-slate-700">
              Company Entity Name
            </label>
            <input
              type="text"
              name="name"
              id="name"
              defaultValue={company?.name}
              required
              placeholder="e.g. Al-Bayaan Construction Ltd"
              className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/10 transition-all"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              id="email"
              defaultValue={company?.email || ""}
              placeholder="office@example.so"
              className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/10 transition-all"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-semibold text-slate-700">
              Phone Number
            </label>
            <input
              type="text"
              name="phone"
              id="phone"
              defaultValue={company?.phone || ""}
              placeholder="+252..."
              className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/10 transition-all"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="address" className="block text-sm font-semibold text-slate-700">
              Business Address
            </label>
            <textarea
              name="address"
              id="address"
              rows={3}
              defaultValue={company?.address || ""}
              placeholder="Full physical address for invoices"
              className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/10 transition-all resize-none"
            />
          </div>

          <div>
            <label htmlFor="website" className="block text-sm font-semibold text-slate-700">
              Website
            </label>
            <input
              type="text"
              name="website"
              id="website"
              defaultValue={company?.website || ""}
              placeholder="https://example.so"
              className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/10 transition-all"
            />
          </div>

          <div>
            <label htmlFor="taxId" className="block text-sm font-semibold text-slate-700">
              Tax ID / registration #
            </label>
            <input
              type="text"
              name="taxId"
              id="taxId"
              defaultValue={company?.taxId || ""}
              placeholder="e.g. TR-12345678"
              className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/10 transition-all"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-slate-700">Company Logo</label>
            <div className="mt-2 flex items-center gap-6">
              {logoUrl ? (
                <div className="relative group">
                  <img 
                    src={logoUrl} 
                    alt="Company Logo" 
                    className="h-20 w-32 rounded-xl border border-slate-200 object-contain bg-slate-50 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setLogoUrl(null)}
                    className="absolute -top-2 -right-2 bg-red-100 text-red-600 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm border border-red-200"
                    title="Remove Logo"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                  </button>
                </div>
              ) : (
                <div className="h-20 w-32 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50/50">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setSelectedLogoFile(e.target.files?.[0] ?? null)}
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="inline-flex items-center px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95"
                  >
                    {selectedLogoFile ? "Change File" : "Choose Logo"}
                  </button>
                  {selectedLogoFile && (
                    <button
                      type="button"
                      onClick={handleLogoUpload}
                      disabled={logoUploading}
                      className="inline-flex items-center px-4 py-2 rounded-lg bg-teal-600 text-sm font-semibold text-white hover:bg-teal-700 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                    >
                      {logoUploading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                          Uploading...
                        </>
                      ) : "Confirm & Upload"}
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Recommended: Rectangular logo, transparent or white background</p>
              </div>
            </div>
            {selectedLogoFile && !logoUploading && (
              <p className="mt-2 text-xs text-amber-600 font-medium flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Click "Confirm & Upload" to finalize the logo selection
              </p>
            )}
            <input type="hidden" name="logoUrl" value={logoUrl || ""} />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="notes" className="block text-sm font-semibold text-slate-700">
              Default Terms & Conditions
            </label>
            <textarea
              name="notes"
              id="notes"
              rows={4}
              defaultValue={company?.notes || ""}
              placeholder="These terms will appear on all invoices generated by this company entity"
              className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/10 transition-all resize-none"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-6 border-t border-slate-100">
          {company && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="w-full sm:w-auto rounded-xl px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              Delete Entity
            </button>
          )}
          
          <button
            type="button"
            onClick={() => router.push("/companies")}
            className="w-full sm:w-auto rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={isPending}
            className="w-full sm:w-auto rounded-xl bg-teal-600 px-8 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 disabled:opacity-50 transition-all active:scale-[0.98]"
          >
            {isPending ? "Saving..." : company ? "Update Company" : "Create Company"}
          </button>
        </div>
      </form>
    </div>
  );
}
