import Link from "next/link";
import { CompanyForm } from "../company-form";
import { getOrganization } from "@/lib/organization-context";

export default async function NewCompanyPage() {
  const org = await getOrganization();

  return (
    <div className="">
      <div className="mb-8">
        <Link
          href="/companies"
          className="group inline-flex items-center text-sm font-medium text-teal-600 hover:text-teal-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 transition-transform group-hover:-translate-x-1"><path d="m15 18-6-6 6-6"/></svg>
          Back to Companies
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 font-display">Add Company Entity</h1>
        <p className="mt-1 text-sm text-slate-500">Register a new business entity for your projects and expenses</p>
      </div>

      <CompanyForm organizationId={org.id} />
    </div>
  );
}
