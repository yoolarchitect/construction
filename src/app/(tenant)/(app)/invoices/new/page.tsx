import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { InvoiceForm } from "../invoice-form";
import { getLatestInvoiceNumber } from "../actions";

export default async function NewInvoicePage() {
  const [projects, companies, nextInvoiceNumber] = await Promise.all([
    prisma.project.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        installments: {
          select: { id: true, label: true, amount: true, dueDate: true },
          orderBy: { sortOrder: 'asc' }
        }
      }
    }),
    prisma.company.findMany({
      where: {},
      select: { id: true, name: true, logoUrl: true, isDefault: true }
    }),
    getLatestInvoiceNumber()
  ]);

  return (
    <div className="">
      <div className="mb-8">
        <Link
          href="/invoices"
          className="group inline-flex items-center text-sm font-medium text-teal-600 hover:text-teal-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 transition-transform group-hover:-translate-x-1"><path d="m15 18-6-6 6-6"/></svg>
          Back to Invoices
        </Link>
        <h1 className="mt-2 text-3xl font-black text-slate-900 font-display">New Invoice</h1>
        <p className="mt-1 text-sm text-slate-500 font-medium">Create a professional invoice and link it to your projects</p>
      </div>

      <InvoiceForm 
        projects={projects.map((p: any) => ({
          ...p,
          installments: p.installments.map((i: any) => ({ ...i, amount: Number(i.amount) }))
        }))} 
        companies={companies} 
        nextInvoiceNumber={nextInvoiceNumber}
      />
    </div>
  );
}
