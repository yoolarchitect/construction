"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@imagekit/next";
import {
  createProjectDocumentAction,
  deleteProjectDocumentAction,
} from "../actions";
import { DocumentPreviewModal } from "@/components/DocumentPreviewModal";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];
const ACCEPT = "image/jpeg,image/png,image/gif,image/webp,application/pdf";

type ProjectDocument = {
  id: string;
  name: string;
  fileUrl: string;
  mimeType: string;
  createdAt: Date;
};

export function ProjectDocumentsSection({
  projectId,
  documents,
  organizationId,
}: {
  projectId: string;
  documents: ProjectDocument[];
  organizationId: string;
}) {
  const router = useRouter();
  const [previewDoc, setPreviewDoc] = useState<ProjectDocument | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type) && !file.type.startsWith("image/")) {
      alert("Only images (JPEG, PNG, GIF, WebP) and PDF are allowed.");
      e.target.value = "";
      return;
    }
    setUploading(true);
    try {
      const auth = await getAuth();
      const ext = file.name.split(".").pop() || (file.type === "application/pdf" ? "pdf" : "png");
      const fileName = `organization/${organizationId}/projects/${projectId}/doc-${Date.now()}.${ext}`;
      const uploadResult = await upload({
        file,
        fileName,
        ...auth,
      });
      const url = uploadResult.url;
      if (!url) throw new Error("No URL returned from upload");

      const formData = new FormData();
      formData.set("projectId", projectId);
      formData.set("name", file.name);
      formData.set("fileUrl", url);
      formData.set("mimeType", file.type);
      setError(null);
      const createResult = await createProjectDocumentAction(null, formData);
      if (createResult && "error" in createResult) {
        setError(createResult.error ?? null);
      } else {
        router.refresh();
      }
      e.target.value = "";
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const isImage = (mime: string) => mime.startsWith("image/");
  const isPdf = (mime: string) => mime === "application/pdf";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">
            {documents.length} document{documents.length !== 1 ? "s" : ""} (images or PDF)
          </p>
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-primary text-sm"
            disabled={uploading}
          >
            {uploading ? "Uploading…" : "Upload document"}
          </button>
        </div>
      </div>

      {documents.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">No documents yet. Upload an image or PDF above.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-slate-50/50"
            >
              <button
                type="button"
                onClick={() => setPreviewDoc(doc)}
                className="flex min-h-[120px] flex-1 flex-col items-center justify-center p-3 text-left hover:bg-slate-100/80"
              >
                {isImage(doc.mimeType) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={doc.fileUrl}
                    alt={doc.name}
                    className="max-h-32 w-full object-contain"
                  />
                ) : isPdf(doc.mimeType) ? (
                  <div className="flex h-24 w-full items-center justify-center rounded border border-slate-200 bg-white">
                    <svg
                      className="h-12 w-12 text-red-500"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h6v4h4v12H6zm2-2h4v-2H8v2zm0-4h4v-2H8v2zm0-4h2v-2H8v2z" />
                    </svg>
                  </div>
                ) : null}
                <span className="mt-2 line-clamp-2 w-full text-left text-xs font-medium text-slate-700">
                  {doc.name}
                </span>
                <span className="mt-0.5 text-xs text-slate-500">Click to preview</span>
              </button>
              <div className="flex items-center justify-between border-t border-slate-200 px-3 py-2">
                <span className="truncate text-xs text-slate-600">{doc.name}</span>
                <form action={deleteProjectDocumentAction} className="inline">
                  <input type="hidden" name="projectId" value={projectId} />
                  <input type="hidden" name="documentId" value={doc.id} />
                  <button
                    type="submit"
                    className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    aria-label="Delete document"
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
          ))}
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
