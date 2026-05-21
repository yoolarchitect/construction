"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState, useRef } from "react";
import { upload } from "@imagekit/next";
import { updateOrganizationSettingsAction } from "./actions";
import { useFormAlert } from "@/components/useFormAlert";

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary w-full sm:w-auto px-10 py-4 shadow-xl shadow-teal-600/20 active:scale-[0.98] transition-all" disabled={pending || disabled}>
      {pending && (
        <svg className="h-5 w-5 mr-3 animate-spin" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {pending ? "Saving Changes..." : "Securely Save Settings"}
    </button>
  );
}

export function SettingsForm({
  initialName,
  initialBusinessInfo,
  initialLogoUrl,
  initialFaviconUrl,
  organizationId,
}: {
  initialName: string;
  initialBusinessInfo: string | null;
  initialLogoUrl: string | null;
  initialFaviconUrl: string | null;
  organizationId: string;
}) {
  const [state, formAction] = useFormState(updateOrganizationSettingsAction, null);
  useFormAlert(state);

  const [logoUrl, setLogoUrl] = useState<string | null>(initialLogoUrl);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(initialFaviconUrl);
  const [logoUploading, setLogoUploading] = useState(false);
  const [faviconUploading, setFaviconUploading] = useState(false);
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [selectedFaviconFile, setSelectedFaviconFile] = useState<File | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const isUploading = logoUploading || faviconUploading;

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
    const fileName = `organization/${organizationId}/logo-${Date.now()}.${ext}`;
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

  const handleFaviconUpload = async () => {
    if (!selectedFaviconFile) {
      faviconInputRef.current?.click();
      return;
    }
    const ext = selectedFaviconFile.name.split(".").pop() || "ico";
    const fileName = `organization/${organizationId}/favicon-${Date.now()}.${ext}`;
    setFaviconUploading(true);
    try {
      const auth = await getAuth();
      const result = await upload({
        file: selectedFaviconFile,
        fileName,
        ...auth,
      });
      setFaviconUrl(result.url ?? null);
      setSelectedFaviconFile(null);
      if (faviconInputRef.current) faviconInputRef.current.value = "";
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Favicon upload failed");
    } finally {
      setFaviconUploading(false);
    }
  };

  return (
    <form action={formAction} className="space-y-10">
      <input type="hidden" name="logoUrl" value={logoUrl ?? ""} />
      <input type="hidden" name="faviconUrl" value={faviconUrl ?? ""} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="group">
            <label htmlFor="name" className="label">Brand Identifier / System Name</label>
            <input
              id="name"
              name="name"
              type="text"
              defaultValue={initialName}
              className="input text-lg font-bold"
              placeholder="e.g. Acme Construction"
              required
            />
          </div>

          <div className="group">
            <label htmlFor="businessInfo" className="label">Commercial Information</label>
            <textarea
              id="businessInfo"
              name="businessInfo"
              rows={5}
              defaultValue={initialBusinessInfo ?? ""}
              className="input resize-none"
              placeholder="Full legal address, contact details, tax identification numbers, etc."
            />
            <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Displayed on official documents and receipts</p>
          </div>
        </div>

        <div className="space-y-8">
          <div className="card !p-6 bg-slate-50/30 border-dashed border-slate-200">
            <label className="label mb-4">Official Logo</label>
            <div className="flex flex-col gap-6">
              <div className="relative group cursor-pointer" onClick={() => logoInputRef.current?.click()}>
                <div className="h-32 w-full rounded-2xl bg-white border border-white shadow-inner flex items-center justify-center overflow-hidden transition-all group-hover:bg-slate-50">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="h-full w-full object-contain p-4" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-300">
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m16 16-4-4-4 4"/></svg>
                      <span className="text-xs font-bold uppercase tracking-widest leading-none">Drop or Click</span>
                    </div>
                  )}
                </div>
                {selectedLogoFile && (
                   <div className="absolute inset-x-0 -bottom-3 flex justify-center">
                      <span className="bg-teal-600 text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full shadow-lg animate-bounce">File Ready</span>
                   </div>
                )}
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setSelectedLogoFile(e.target.files?.[0] ?? null)}
              />
              <div className="flex gap-2">
                 <button
                  type="button"
                  onClick={handleLogoUpload}
                  className="btn btn-primary flex-1 shadow-none"
                  disabled={isUploading || !selectedLogoFile}
                >
                  {logoUploading ? "Uploading…" : "Apply Logo"}
                </button>
                 <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="btn btn-secondary px-3"
                  disabled={isUploading}
                >
                   <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                </button>
              </div>
            </div>
          </div>

          <div className="card !p-6 bg-slate-50/30 border-dashed border-slate-200">
            <label className="label mb-4">Tab Icon (Favicon)</label>
            <div className="flex items-center gap-6">
              <div className="h-12 w-12 rounded-xl bg-white border border-white shadow-inner flex items-center justify-center shrink-0 overflow-hidden cursor-pointer" onClick={() => faviconInputRef.current?.click()}>
                 {faviconUrl ? (
                    <img src={faviconUrl} alt="Favicon" className="h-6 w-6 object-contain" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-200"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/></svg>
                  )}
              </div>
              <div className="flex-1 flex flex-col gap-2">
                 <input
                  ref={faviconInputRef}
                  type="file"
                  accept="image/x-icon,image/png,image/svg+xml"
                  className="hidden"
                  onChange={(e) => setSelectedFaviconFile(e.target.files?.[0] ?? null)}
                />
                <button
                  type="button"
                  onClick={handleFaviconUpload}
                  className="btn btn-secondary w-full text-xs py-2"
                  disabled={isUploading || !selectedFaviconFile}
                >
                  {faviconUploading ? "Uploading…" : (selectedFaviconFile ? "Update Icon" : "Choose Favicon")}
                </button>
                <p className="text-[10px] text-slate-400 font-medium">PNG, ICO or SVG are supported.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-8 border-t border-slate-100 flex items-center justify-between">
         <div className="hidden sm:block">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Last Updated</p>
            <p className="text-sm text-slate-900 font-bold">Never</p>
         </div>
         <SubmitButton disabled={isUploading} />
      </div>
    </form>
  );
}
