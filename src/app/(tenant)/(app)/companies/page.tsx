import { prisma } from "@/lib/prisma";
import { getOrganization } from "@/lib/organization-context";
import { setDefaultCompany } from "./actions";
import Link from "next/link";

export default async function CompaniesPage() {
  const org = await getOrganization();

  const [companies, companyCount] = await Promise.all([
    prisma.company.findMany({
      orderBy: { createdAt: "desc" },
    }),
    prisma.company.count(),
  ]);

  const canAddMore =
    companyCount < (org.maxCompanies || (org.hasMultipleCompanies ? 100 : 1));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-display">Companies</h1>
          <p className="text-sm text-slate-500">Manage your business entities and locations</p>
        </div>

        {canAddMore && (
          <Link
            href="/companies/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-teal-700 active:scale-[0.98]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            Add Company
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {companies.map((company: any) => (
          <div key={company.id} className="relative group overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-teal-200">
            {company.isDefault && (
              <div className="absolute top-0 right-0 rounded-bl-xl bg-teal-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                Main
              </div>
            )}
            <div className="flex items-start gap-4 mb-4">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-teal-600 border border-slate-200/60">
                {company.logoUrl ? (
                  <img
                    src={company.logoUrl}
                    alt={`${company.name} logo`}
                    className="h-full w-full object-contain bg-white"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-slate-900 truncate">{company.name}</h3>
                <p className="text-sm text-slate-500 truncate">{company.email || "No email"}</p>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                {company.phone || "N/A"}
              </div>
              <div className="flex items-start gap-2 text-xs text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 text-slate-400"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                <span className="line-clamp-2">{company.address || "No address"}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/companies/${company.id}`}
                className="flex-1 text-center py-2 text-xs font-semibold text-teal-600 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors"
              >
                Edit Details
              </Link>
              {!company.isDefault && (
                <form action={async () => {
                  "use server";
                  await setDefaultCompany(company.id);
                }}>
                  <button className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-teal-600 transition-colors">
                    Make Main
                  </button>
                </form>
              )}
            </div>
          </div>
        ))}

        {companies.length === 0 && (
          <div className="col-span-full py-12 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50">
            <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-slate-200 text-slate-400 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900">No companies found</h3>
            <p className="text-sm text-slate-500 mb-6">Get started by creating your first business entity.</p>
            <Link
              href="/companies/new"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-700"
            >
              Create First Company
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
