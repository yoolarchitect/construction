"use client";

import { AccessDeniedContact } from "./(tenant)/access-denied-contact";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  if (error.name === "OrganizationNotConfiguredError") {
    return <AccessDeniedContact />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
        <h1 className="text-xl font-bold text-slate-900">Something went wrong</h1>
        <p className="mt-2 text-sm text-slate-600">{error.message}</p>
      </div>
    </div>
  );
}
