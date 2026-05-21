"use client";

export type PreviewDocument = {
  id: string;
  name: string;
  fileUrl: string;
  mimeType: string;
};

export function DocumentPreviewModal({
  document: doc,
  onClose,
}: {
  document: PreviewDocument;
  onClose: () => void;
}) {
  const isImage = doc.mimeType.startsWith("image/");
  const isPdf = doc.mimeType === "application/pdf";

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/95"
      role="dialog"
      aria-modal="true"
      aria-label={`Preview: ${doc.name}`}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
        <span className="truncate text-sm font-medium text-white">{doc.name}</span>
        <button
          type="button"
          onClick={onClose}
          className="ml-4 rounded p-2 text-white/80 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50"
          aria-label="Close preview"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-4">
        {isImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={doc.fileUrl}
            alt={doc.name}
            className="max-h-full max-w-full object-contain"
          />
        )}
        {isPdf && (
          <iframe
            src={doc.fileUrl}
            title={doc.name}
            className="h-full min-h-[80vh] w-full max-w-4xl rounded border-0"
          />
        )}
        {!isImage && !isPdf && (
          <p className="text-white/70">Preview not available for this file type.</p>
        )}
      </div>
    </div>
  );
}
