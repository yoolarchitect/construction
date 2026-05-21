export function AccessDeniedContact() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <h1 className="text-xl font-bold text-slate-900">
            Access not available
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            This workspace does not exist or you do not have access. Please contact us for access or support.
          </p>
        </div>
        <div className="mt-8 border-t border-slate-100 pt-6">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Contact
          </p>
          <p className="mt-2 font-semibold text-slate-900">
            Abdirahman Buryar
          </p>
          <a
            href="tel:+252907700949"
            className="mt-1 block text-teal-600 hover:text-teal-700 hover:underline"
          >
            +252 907 700 949
          </a>
        </div>
      </div>
    </div>
  );
}
