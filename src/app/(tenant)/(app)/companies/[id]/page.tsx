import { prisma } from "@/lib/prisma";
import { getOrganization } from "@/lib/organization-context";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CompanyForm } from "../company-form";

export default async function EditCompanyPage({
  params,
}: {
  params: { id: string };
}) {
  const org = await getOrganization();

  const company = await prisma.company.findUnique({
    where: {
      id: params.id,
    },
  });

  if (!company) notFound();

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
        <h1 className="mt-2 text-2xl font-bold text-slate-900 font-display">Edit: {company.name}</h1>
        <p className="mt-1 text-sm text-slate-500">Update company details or manage this entity</p>
      </div>

      <CompanyForm company={company} organizationId={org.id} />
    </div>
  );
}
