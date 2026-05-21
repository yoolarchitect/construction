import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { QuotationForm } from "../quotation-form";
import { getLatestQuotationNumber } from "../actions";

export default async function NewQuotationPage() {
  const [projects, companies, nextQuotationNumber] = await Promise.all([
    prisma.project.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.company.findMany({
      select: { id: true, name: true, logoUrl: true, isDefault: true },
      orderBy: { name: "asc" },
    }),
    getLatestQuotationNumber(),
  ]);

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/quotations"
          className="group inline-flex items-center text-sm font-medium text-teal-600 hover:text-teal-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 transition-transform group-hover:-translate-x-1"><path d="m15 18-6-6 6-6"/></svg>
          Back to Quotations
        </Link>
        <h1 className="mt-2 text-3xl font-black text-slate-900 font-display">New Quotation</h1>
        <p className="mt-1 text-sm text-slate-500 font-medium">Create a professional price quotation for your client</p>
      </div>

      <QuotationForm projects={projects} companies={companies} nextQuotationNumber={nextQuotationNumber} />
    </div>
  );
}
