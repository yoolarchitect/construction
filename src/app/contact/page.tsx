import Link from "next/link";

const CONTACT_NAME = "Abdirahman Buryar";
const CONTACT_PHONE = "+252907700949";
const CONTACT_EMAIL = "abdirahman.buryar@gmail.com";

export default function ContactPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Company not found
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          The application is not configured yet, or you need access. Please contact support.
        </p>
        <div className="mt-6 text-left">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 text-center">Contact Us</p>
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
            <p className="font-semibold text-slate-900 text-center mb-4">{CONTACT_NAME}</p>
            
            <div className="flex flex-col gap-2">
              <a
                href={`tel:${CONTACT_PHONE.replace(/\s/g, "")}`}
                className="flex items-center justify-center gap-3 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-teal-700 active:scale-[0.98]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                {CONTACT_PHONE}
              </a>
              
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="flex items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 active:scale-[0.98]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                {CONTACT_EMAIL}
              </a>
            </div>
          </div>
        </div>
        <p className="mt-6 text-[10px] font-medium text-slate-400 uppercase tracking-widest">
          Call, WhatsApp or Email to get started
        </p>
      </div>
    </div>
  );
}
