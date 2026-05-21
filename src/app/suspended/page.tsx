export default function SuspendedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Access suspended</h1>
        <p className="mt-3 text-sm text-slate-600">
          Your account access has been restricted. Please contact your administrator.
        </p>
      </div>
    </div>
  );
}
